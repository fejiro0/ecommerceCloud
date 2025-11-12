import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        categoryName: 'asc',
      },
    });

    return NextResponse.json({
      status: 'success',
      data: { categories },
    });
  } catch (error: any) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch categories',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryName, description } = body;

    // Validation
    if (!categoryName) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Category name is required',
        },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        categoryName: {
          equals: categoryName,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Category with this name already exists',
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        categoryName,
        description,
      },
    });

    return NextResponse.json(
      {
        status: 'success',
        message: 'Category created successfully',
        data: { category },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create category',
      },
      { status: 500 }
    );
  }
}
