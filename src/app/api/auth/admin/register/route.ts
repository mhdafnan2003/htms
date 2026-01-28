import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { email, password, name, phone } = await req.json();

    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    
    const user = new User({
      email,
      password: hashedPassword,
      fullName: name,
      role: 'ADMIN', // Force role to ADMIN for admin registration
      phone,
    });

    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}