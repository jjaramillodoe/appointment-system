import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { findClosestHubForAddress } from '@/utils/hubMatching';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    return null;
  }
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

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { street, city, state, zipCode } = body;

    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'All address fields are required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the address
    user.address = {
      street,
      city,
      state,
      zipCode
    };

    // Recalculate closest hub based on new address
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
    
    const closestHubMatch = await findClosestHubForAddress(fullAddress);

    // Update the closestHub with the matched hub data
    if (closestHubMatch) {
      user.closestHub = {
        name: closestHubMatch.hub.name,
        address: closestHubMatch.hub.address,
        latitude: closestHubMatch.hub.latitude,
        longitude: closestHubMatch.hub.longitude,
        distance: closestHubMatch.distance,
        distanceText: closestHubMatch.distanceText,
      };
    } else {
      // If geocoding fails, keep the existing closestHub
      // This prevents the user from losing their hub assignment
    }

    await user.save();

    // Return updated user data (without password)
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
      closestHub: user.closestHub,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin || false,
    };

    return NextResponse.json({
      message: 'Address updated successfully',
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Failed to update address', details: error.message },
      { status: 500 }
    );
  }
} 