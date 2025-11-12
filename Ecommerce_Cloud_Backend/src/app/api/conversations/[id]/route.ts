import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/conversations/[id] - Get conversation with all messages
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    console.log('Fetching conversation:', id);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            businessName: true,
            storeLogo: true,
            whatsappNumber: true,
            isSeller: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            businessName: true,
            storeLogo: true,
            whatsappNumber: true,
            isSeller: true,
          },
        },
        product: {
          select: {
            id: true,
            productName: true,
            imageURL: true,
            price: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { status: 'error', message: 'Conversation not found' },
        { status: 404 }
      );
    }

    console.log(`Found conversation with ${conversation.messages.length} messages`);

    return NextResponse.json({
      status: 'success',
      data: { conversation },
    });
  } catch (error: any) {
    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch conversation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id] - Mark messages as read
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userId } = body; // ID of user marking as read

    console.log(`Marking messages as read for user ${userId} in conversation:`, id);

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the conversation to determine if user is sender or receiver
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { status: 'error', message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this conversation
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json(
        { status: 'error', message: 'Not authorized' },
        { status: 403 }
      );
    }

    // Update all unread messages from the other party
    const otherUserId = conversation.senderId === userId ? conversation.receiverId : conversation.senderId;

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: otherUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Reset unread count for this user
    const updateData =
      conversation.senderId === userId
        ? { senderUnread: 0 }
        : { receiverUnread: 0 };

    await prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    console.log('Marked messages as read');

    return NextResponse.json({
      status: 'success',
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    console.error('Failed to mark messages as read:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to mark messages as read',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    console.log('Deleting conversation:', id);

    await prisma.conversation.delete({
      where: { id },
    });

    console.log('Conversation deleted');

    return NextResponse.json({
      status: 'success',
      message: 'Conversation deleted',
    });
  } catch (error: any) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to delete conversation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

