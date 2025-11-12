import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      region,
      city,
      address,
      // Optional seller fields
      businessName,
      isSeller = false,
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !phoneNumber || !password || !region || !city || !address) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Please provide all required fields',
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email already registered',
        },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Phone number already registered',
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        password: hashedPassword,
        region,
        city,
        address,
        businessName: businessName || null,
        isSeller,
      },
    });

    // Remove password from response
    const { password: _pw, ...safeUser } = user;

    return NextResponse.json(
      {
        status: 'success',
        message: 'Registration successful',
        data: { user: safeUser },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to register',
      },
      { status: 500 }
    );
  }
}

