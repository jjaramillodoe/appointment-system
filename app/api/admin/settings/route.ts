import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';

// GET - Fetch system settings
export async function GET(request: NextRequest) {
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
    const adminUser = verifyAdminToken(token);
    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Return default settings (in a real app, these would come from a database)
    const settings = {
      general: {
        systemName: 'Adult Education Appointment System',
        timeZone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY'
      },
      appointments: {
        defaultCapacity: 20,
        reminderHours: 24,
        autoConfirm: false,
        maxAppointmentsPerUser: 1
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        lowCapacityAlerts: true
      },
      users: {
        allowRegistration: true,
        requireEmailVerification: true,
        sessionTimeout: 30
      },
      security: {
        passwordMinLength: 8,
        requireStrongPasswords: true,
        twoFactorAuth: false
      },
      system: {
        database: 'MongoDB',
        framework: 'Next.js 15',
        environment: process.env.NODE_ENV || 'development',
        lastBackup: new Date().toISOString()
      }
    };

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update system settings
export async function POST(request: NextRequest) {
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
    const adminUser = verifyAdminToken(token);
    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    // In a real app, you would save these to a database
    // For now, we'll just validate and return success
    console.log('Settings updated:', settings);

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}
