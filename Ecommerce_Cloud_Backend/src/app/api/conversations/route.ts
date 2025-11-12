import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/conversations - Get all conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType'); // 'customer' or 'vendor'

    if (!userId || !userType) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'User ID and user type are required',
        },
        { status: 400 }
      );
    }

    console.log(`Fetching conversations for ${userType}:`, userId);

    // Build query based on user type
    const whereClause =
      userType === 'customer'
        ? { customerId: userId }
        : userType === 'vendor'
        ? { vendorId: userId }
        : {};

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
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
            senderType: true,
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

// POST /api/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, vendorId, productId, subject } = body;

    console.log('Creating/finding conversation:', { customerId, vendorId, productId });

    // Validation
    if (!customerId || !vendorId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Customer ID and vendor ID are required',
        },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        customerId,
        vendorId,
        ...(productId && { productId }),
      },
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

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { status: 'error', message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { status: 'error', message: 'Vendor not found' },
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

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        customerId,
        vendorId,
        productId: productId || null,
        subject: subject || `Chat with ${vendor.vendorName}`,
      },
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

