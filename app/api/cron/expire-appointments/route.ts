import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { expirePastAppointments } from '@/lib/appointmentLifecycle';

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const expired = await expirePastAppointments();
  return NextResponse.json({ success: true, expired });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
