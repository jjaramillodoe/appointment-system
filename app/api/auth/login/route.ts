import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Connect to database with error handling
    try {
      await dbConnect();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: dbError.message,
          code: dbError.code || 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Find user by email (lowercase to match schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin || false },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      sex: user.sex,
      preferredLanguage: user.preferredLanguage,
      heardFrom: user.heardFrom,
      barriersToLearning: user.barriersToLearning,
      address: user.address,
      educationLevel: user.educationLevel,
      employmentStatus: user.employmentStatus,
      schoolInterest: user.schoolInterest || '',
      programInterests: user.programInterests || [],
      closestHub: user.closestHub || null,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin || false,
    };



    return NextResponse.json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
} 