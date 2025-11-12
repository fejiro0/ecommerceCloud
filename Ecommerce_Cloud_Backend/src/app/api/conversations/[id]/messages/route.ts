import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/conversations/[id]/messages - Send a message in a conversation
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: conversationId } = await context.params;
    const body = await request.json();
    const { content, senderId, senderType } = body;

    console.log('Sending message:', { conversationId, senderId, senderType, contentLength: content?.length });

    // Validation
    if (!content || !senderId || !senderType) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Content, sender ID, and sender type are required',
          missing: {
            content: !content,
            senderId: !senderId,
            senderType: !senderType,
          },
        },
        { status: 400 }
      );
    }

    if (senderType !== 'customer' && senderType !== 'vendor') {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Sender type must be either "customer" or "vendor"',
        },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { status: 'error', message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify sender is part of this conversation
    const isValidSender =
      (senderType === 'customer' && conversation.customerId === senderId) ||
      (senderType === 'vendor' && conversation.vendorId === senderId);

    if (!isValidSender) {
      return NextResponse.json(
        { status: 'error', message: 'Sender is not part of this conversation' },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        senderId,
        senderType,
        isRead: false,
      },
    });

    // Update conversation's last message time and increment unread count for recipient
    const updateData: any = {
      lastMessageAt: new Date(),
    };

    if (senderType === 'customer') {
      updateData.vendorUnread = { increment: 1 };
    } else {
      updateData.customerUnread = { increment: 1 };
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
    });

    console.log('Message sent successfully:', message.id);

    return NextResponse.json(
      {
        status: 'success',
        message: 'Message sent',
        data: { message },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      },
      { status: 500 }
    );
  }
}

