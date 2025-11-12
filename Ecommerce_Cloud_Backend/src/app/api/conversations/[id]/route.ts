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
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            vendorName: true,
            email: true,
            storeLogo: true,
            whatsappNumber: true,
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
            senderType: true,
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
    const { userType } = body; // 'customer' or 'vendor'

    console.log(`Marking messages as read for ${userType} in conversation:`, id);

    if (!userType) {
      return NextResponse.json(
        { status: 'error', message: 'User type is required' },
        { status: 400 }
      );
    }

    // Update all unread messages from the other party
    const otherSenderType = userType === 'customer' ? 'vendor' : 'customer';

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderType: otherSenderType,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Reset unread count for this user
    const updateData =
      userType === 'customer'
        ? { customerUnread: 0 }
        : { vendorUnread: 0 };

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

