import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { sendDueReminders } from '@/lib/reminderService';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

// Runs hourly (see vercel.json); each run sends whatever reminders have come due
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const result = await sendDueReminders();
    if (result.failed > 0) logger.warn('Some appointment reminders failed', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('Reminder cron failed:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
