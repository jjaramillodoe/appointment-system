import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import { sendDueReminders } from '@/lib/reminderService';

// "Send now": runs the same job as the hourly cron instead of waiting for the next run
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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const result = await sendDueReminders();
    if (!result.enabled) {
      const error = result.skippedReason === 'smtp_not_configured'
        ? 'Email is not configured on the server (SMTP_HOST is missing), so no reminders were sent.'
        : 'Reminders are disabled or none are configured.';
      return NextResponse.json({ error, remindersSent: 0, remindersFailed: 0 }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: `Reminders processed: ${result.sent} sent, ${result.failed} failed`,
      remindersSent: result.sent,
      remindersFailed: result.failed,
    });
  } catch (error: any) {
    logger.error('Send reminders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
