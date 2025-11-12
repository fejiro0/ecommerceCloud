import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Please provide email/phone and password',
        },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { phoneNumber: identifier.trim() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Your account is not active. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Remove password from response
    const { password: _pw, ...safeUser } = user;

    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      data: { user: safeUser },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to login',
      },
      { status: 500 }
    );
  }
}

