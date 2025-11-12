import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/conversations-unified - Get all conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    console.log(`Fetching conversations for user:`, userId);

    // Get conversations where user is either sender or receiver
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            storeLogo: true,
            isSeller: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            storeLogo: true,
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
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    console.log(`Found ${conversations.length} conversations`);

    return NextResponse.json({
      status: 'success',
      data: { conversations, count: conversations.length },
    });
  } catch (error: any) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch conversations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations-unified - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, productId, subject } = body;

    console.log('Creating/finding conversation:', { senderId, receiverId, productId });

    // Validation
    if (!senderId || !receiverId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Sender ID and Receiver ID are required',
        },
        { status: 400 }
      );
    }

    // Can't message yourself
    if (senderId === receiverId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'You cannot message yourself',
        },
        { status: 400 }
      );
    }

    // Check if conversation already exists (in either direction)
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            senderId,
            receiverId,
            ...(productId && { productId }),
          },
          {
            senderId: receiverId,
            receiverId: senderId,
            ...(productId && { productId }),
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            storeLogo: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            storeLogo: true,
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
      },
    });

    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      return NextResponse.json({
        status: 'success',
        message: 'Conversation found',
        data: { conversation: existingConversation },
      });
    }

    // Verify users exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender) {
      return NextResponse.json(
        { status: 'error', message: 'Sender not found' },
        { status: 404 }
      );
    }

    if (!receiver) {
      return NextResponse.json(
        { status: 'error', message: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Verify product exists (if provided)
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { status: 'error', message: 'Product not found' },
          { status: 404 }
        );
      }
    }

    // Get receiver's display name
    const receiverName = receiver.businessName || `${receiver.firstName} ${receiver.lastName}`;

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        senderId,
        receiverId,
        productId: productId || null,
        subject: subject || `Chat with ${receiverName}`,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            storeLogo: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            storeLogo: true,
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
      },
    });

    console.log('Created new conversation:', conversation.id);

    return NextResponse.json(
      {
        status: 'success',
        message: 'Conversation created',
        data: { conversation },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to create conversation',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      },
      { status: 500 }
    );
  }
}

