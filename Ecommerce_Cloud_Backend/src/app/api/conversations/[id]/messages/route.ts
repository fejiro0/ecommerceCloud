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
    const { content, senderId } = body;

    console.log('Sending message:', { conversationId, senderId, contentLength: content?.length });

    // Validation
    if (!content || !senderId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Content and sender ID are required',
          missing: {
            content: !content,
            senderId: !senderId,
          },
        },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { senderId: true, receiverId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { status: 'error', message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify sender is part of this conversation
    const isValidSender =
      conversation.senderId === senderId || conversation.receiverId === senderId;

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
        isRead: false,
      },
    });

    // Update conversation's last message time and increment unread count for recipient
    const updateData: any = {
      lastMessageAt: new Date(),
    };

    // Increment unread for the recipient
    if (conversation.senderId === senderId) {
      updateData.receiverUnread = { increment: 1 };
    } else {
      updateData.senderUnread = { increment: 1 };
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

