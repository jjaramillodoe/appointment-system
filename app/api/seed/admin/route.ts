import { logger } from '@/lib/logger';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import * as bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    await dbConnect();

    const adminData = {
      email: 'admin@example.com',
      password: 'Admin@12345',
      firstName: 'Admin',
      lastName: 'User',
      phone: '212-555-0001',
      preferredLanguage: 'English',
      profileCompleted: true,
      registrationSource: 'full' as const,
      isAdmin: true,
      isSuperAdmin: true,
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        email: adminData.email,
        password: 'Admin@12345',
      });
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = await User.create({
      ...adminData,
      password: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      email: adminData.email,
      password: 'Admin@12345',
    });
  } catch (error: any) {
    logger.error('Seed admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed admin user' },
      { status: 500 }
    );
  }
}
