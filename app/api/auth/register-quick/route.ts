import { NextRequest, NextResponse } from 'next/server';
import { getJwtSecret } from '@/lib/jwtSecret';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { validateEmail } from '@/utils/emailValidation';

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(request, RATE_LIMITS.register);
    if (limited) return limited;

    await dbConnect();

    const body = await request.json();
    const { email, password, firstName, lastName, phone, preferredLanguage, registrationSource } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !preferredLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    // Validate phone (10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: 'Phone must be 10 digits' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone: phoneDigits,
      preferredLanguage,
      registrationSource: registrationSource || 'quick',
      profileCompleted: false,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      preferredLanguage: newUser.preferredLanguage,
      profileCompleted: newUser.profileCompleted,
      registrationSource: newUser.registrationSource,
    };

    return NextResponse.json(
      {
        user: userResponse,
        token,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
