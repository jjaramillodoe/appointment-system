import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { normalizeProfileFields } from '../../../../lib/textNormalization';
import { calculateProfileCompletion } from '../../../../lib/profileCompletion';
import { confirmPendingProfileAppointments } from '../../../../lib/appointmentNotifications';

import { getJwtSecret } from '@/lib/jwtSecret';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;

    let profileData = await request.json();

    // Validate required fields
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Normalize text fields to remove special characters and accents
    profileData = normalizeProfileFields(profileData);

    // Build update object, filtering out empty strings for enum fields
    const updateData: any = {
      firstName: profileData.firstName,
      middleName: profileData.middleName,
      lastName: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone,
      dateOfBirth: profileData.dateOfBirth,
      sex: profileData.sex || undefined,
      preferredLanguage: profileData.preferredLanguage,
      additionalLanguages: profileData.additionalLanguages || [],
      heardFrom: profileData.heardFrom || undefined,
      barriersToLearning: profileData.barriersToLearning || [],
      homeAddress: profileData.homeAddress,
      address: profileData.address,
      educationLevel: profileData.educationLevel || undefined,
      employmentStatus: profileData.employmentStatus || undefined,
      employerName: profileData.employerName,
      jobTitle: profileData.jobTitle,
      schoolInterest: profileData.schoolInterest || undefined,
      programInterests: profileData.programInterests || [],
      emergencyContact: profileData.emergencyContact
    };

    // Remove undefined values to avoid validation errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const existingUser = await User.findById(decoded.userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const wasComplete = !!existingUser.profileCompleted;
    const completion = calculateProfileCompletion({
      ...existingUser.toObject(),
      ...updateData,
    });
    updateData.profileCompleted = completion.isComplete;

    // Update user profile without strict validation (schema will validate on save)
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { returnDocument: 'after', runValidators: false }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!wasComplete && completion.isComplete) {
      await confirmPendingProfileAppointments(updatedUser);
    }

    // Remove sensitive information before sending response
    const { password, ...userResponse } = updatedUser.toObject();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse,
      profileCompletion: completion,
    });

  } catch (error: any) {
    logger.error('Profile update error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.message },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 