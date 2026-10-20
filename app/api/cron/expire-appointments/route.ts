import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { expirePastAppointments } from '@/lib/appointmentLifecycle';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const expired = await expirePastAppointments();
  return NextResponse.json({ success: true, expired });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
