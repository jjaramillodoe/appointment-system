import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import models
import '@/models/User';
import '@/models/Appointment';

import mongoose from 'mongoose';
const User = mongoose.models.User;
const Appointment = mongoose.models.Appointment;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin: boolean };
  } catch (error) {
    return null;
  }
}

// GET - Get all users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const hubName = searchParams.get('hubName') || '';
    const educationLevel = searchParams.get('educationLevel') || '';
    const programInterest = searchParams.get('programInterest') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build search filter
    const searchFilter: any = {};
    if (search) {
      searchFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build hub filter
    if (hubName) {
      searchFilter['closestHub.name'] = hubName;
    }

    // Build education level filter
    if (educationLevel) {
      searchFilter.educationLevel = educationLevel;
    }

    // Build program interest filter
    if (programInterest) {
      searchFilter.programInterests = programInterest;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination
    const users = await User.find(searchFilter)
      .select('-password') // Exclude password
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchFilter);

    // Get user statistics
    const userStats = await User.aggregate([
      { $match: searchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgAge: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      }
    ]);

    // Get education level distribution
    const educationDistribution = await User.aggregate([
      { $match: searchFilter },
      {
        $group: {
          _id: '$educationLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get program interest distribution
    const programDistribution = await User.aggregate([
      { $match: searchFilter },
      { $unwind: '$programInterests' },
      {
        $group: {
          _id: '$programInterests',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get hub distribution
    const hubDistribution = await User.aggregate([
      { $match: searchFilter },
      {
        $group: {
          _id: '$closestHub.name',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      },
      stats: userStats[0] || { total: 0, avgAge: 0 },
      educationDistribution,
      programDistribution,
      hubDistribution
    });

  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to get users', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get specific user with appointment history
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's appointment history
    const appointments = await Appointment.find({ userId })
      .sort({ createdAt: -1 });

    // Get user statistics
    const appointmentStats = await Appointment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      user,
      appointments,
      appointmentStats
    });

  } catch (error: any) {
    console.error('User details API error:', error);
    return NextResponse.json(
      { error: 'Failed to get user details', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow updating password through this endpoint
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Update user API error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
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
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user has appointments
    const appointmentCount = await Appointment.countDocuments({ userId });
    
    // Delete user and their appointments
    await Appointment.deleteMany({ userId });
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedAppointments: appointmentCount
    });

  } catch (error: any) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
} 