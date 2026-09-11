import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Find and update admin user to ensure they have super admin flag
    const admin = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      { isAdmin: true, isSuperAdmin: true },
      { new: true }
    );

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user verified and updated',
      admin: {
        email: admin.email,
        isAdmin: admin.isAdmin,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (error: any) {
    console.error('Verify admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify admin' },
      { status: 500 }
    );
  }
}
