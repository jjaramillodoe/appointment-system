import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import mongoose from 'mongoose';
import '@/models/User';

const User = mongoose.models.User;

// POST - Reset user password
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminUser = verifyAdminToken(token);
    if (!isAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Set password as plain text - Mongoose pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password', details: error.message },
      { status: 500 }
    );
  }
}

