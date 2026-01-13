import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import Notification from '@/models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin: boolean };
  } catch (error) {
    return null;
  }
}

// GET - Fetch notifications with pagination and filters
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
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const hubName = searchParams.get('hubName') || '';
    const read = searchParams.get('read') || '';

    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (hubName) filter.hubName = hubName;
    if (read !== '') filter.read = read === 'true';

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('appointmentId', 'appointmentDate appointmentTime hubName')
      .populate('userId', 'firstName lastName email');

    // Get total count for pagination
    const total = await Notification.countDocuments(filter);

    // Get notification statistics
    const stats = {
      total: await Notification.countDocuments(),
      unread: await Notification.countDocuments({ read: false }),
      byType: {
        low_capacity: await Notification.countDocuments({ type: 'low_capacity' }),
        no_show: await Notification.countDocuments({ type: 'no_show' }),
        reminder: await Notification.countDocuments({ type: 'reminder' }),
        system: await Notification.countDocuments({ type: 'system' }),
        appointment: await Notification.countDocuments({ type: 'appointment' })
      }
    };

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Mark notification as read/unread
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
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId || !action) {
      return NextResponse.json(
        { error: 'Notification ID and action are required' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    
    if (action === 'markRead') {
      updateData.read = true;
    } else if (action === 'markUnread') {
      updateData.read = false;
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      updateData,
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification updated successfully',
      notification
    });
  } catch (error: any) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark all notifications as read
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
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'markAllRead') {
      await Notification.updateMany(
        { read: false },
        { read: true }
      );

      return NextResponse.json({
        message: 'All notifications marked as read'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read', details: error.message },
      { status: 500 }
    );
  }
} 