import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import ReminderSettings from '@/models/ReminderSettings';

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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    let settings = await ReminderSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await ReminderSettings.create({
        isEnabled: true,
        reminders: [
          {
            enabled: true,
            hoursBeforeAppointment: 24,
            channel: 'email',
            message: '',
          },
          {
            enabled: true,
            hoursBeforeAppointment: 1,
            channel: 'email',
            message: '',
          },
        ],
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Get reminder settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get settings' },
      { status: 500 }
    );
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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isEnabled, reminders } = body;

    let settings = await ReminderSettings.findOne();

    if (!settings) {
      settings = new ReminderSettings({ isEnabled, reminders });
    } else {
      settings.isEnabled = isEnabled ?? settings.isEnabled;
      settings.reminders = reminders ?? settings.reminders;
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Reminder settings updated',
      settings,
    });
  } catch (error: any) {
    console.error('Update reminder settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
