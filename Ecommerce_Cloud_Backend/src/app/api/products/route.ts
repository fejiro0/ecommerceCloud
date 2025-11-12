import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - Get all products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const vendor = searchParams.get('vendor');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true, // Only show active products by default
    };

    if (category) {
      where.categoryId = category;
    }

    if (vendor) {
      where.vendorId = vendor;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            vendorName: true,
            region: true,
            city: true,
            isVerified: true,
            isActive: true,
            rating: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating for each product
    const productsWithRating = products.map((product) => {
      const ratings = product.reviews.map((review) => review.rating);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0;

      return {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
        reviews: undefined,
      };
    });

    const totalProducts = await prisma.product.count({ where });

    return NextResponse.json({
      status: 'success',
      data: {
        products: productsWithRating,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
          hasNext: skip + limit < totalProducts,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productName,
      description,
      price,
      stockQuantity,
      categoryId,
      vendorId,
      imageURL,
      galleryImages,
      sku,
      brand,
      weight,
      isActive = true,
      highlights,
      deliveryInfo,
      returnPolicy,
      videoURL,
      specifications,
    } = body;

    // Validation
    if (!productName || !description || !price || stockQuantity === undefined || !categoryId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Please provide all required fields: productName, description, price, stockQuantity, categoryId',
        },
        { status: 400 }
      );
    }

    // Validate price and stock quantity
    if (parseFloat(price) <= 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Price must be greater than 0',
        },
        { status: 400 }
      );
    }

    if (parseInt(stockQuantity) < 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Stock quantity cannot be negative',
        },
        { status: 400 }
      );
    }

    // Validate weight if provided
    if (weight && parseFloat(weight) <= 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Weight must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid category ID',
        },
        { status: 400 }
      );
    }

    // Auto-assign vendor if not provided
    let finalVendorId = vendorId;
    if (!finalVendorId) {
      // Get the first available active vendor
      const defaultVendor = await prisma.vendor.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!defaultVendor) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'No active vendor found. Please create a vendor first or specify a vendorId.',
          },
          { status: 400 }
        );
      }

      finalVendorId = defaultVendor.id;
    } else {
      // Verify vendor exists if provided
      const vendor = await prisma.vendor.findUnique({
        where: { id: finalVendorId },
      });

      if (!vendor) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Invalid vendor ID',
          },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        productName,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity),
        categoryId,
        vendorId: finalVendorId,
        imageURL: imageURL || null,
        galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
        sku,
        brand,
        weight: weight ? parseFloat(weight) : null,
        isActive,
        highlights: Array.isArray(highlights) ? highlights : [],
        deliveryInfo: deliveryInfo || null,
        returnPolicy: returnPolicy || null,
        videoURL: videoURL || null,
        specifications: specifications && typeof specifications === 'object' ? specifications : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            vendorName: true,
            region: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        status: 'success',
        message: 'Product created successfully',
        data: { product },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}
