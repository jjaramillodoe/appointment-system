import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyStudentToken } from '@/lib/studentAuth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const decoded = verifyStudentToken(request.headers.get('authorization'));
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const notifications = await Notification.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();
    const unreadCount = notifications.filter((item) => !item.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    logger.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const decoded = verifyStudentToken(request.headers.get('authorization'));
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await Notification.updateMany({ userId: decoded.userId, read: false }, { $set: { read: true } });
    } else if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, userId: decoded.userId },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json({ error: 'notificationId or markAll is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
