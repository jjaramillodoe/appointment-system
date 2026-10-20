import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Waitlist from '@/models/Waitlist';
import Hub from '@/models/Hub';
import { verifyStudentToken } from '@/lib/studentAuth';

export async function GET(request: NextRequest) {
  await dbConnect();
  const decoded = verifyStudentToken(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
  }

  const entries = await Waitlist.find({
    userId: decoded.userId,
    status: { $in: ['waiting', 'notified'] },
  }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const decoded = verifyStudentToken(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
  }
  const body = await request.json();
  const { hubId, timePreference, classInterest } = body;
  const userId = decoded.userId;

  if (!hubId) {
    return NextResponse.json({ error: 'hubId is required' }, { status: 400 });
  }

  const hub = await Hub.findById(hubId);
  if (!hub) {
    return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
  }

  const existing = await Waitlist.findOne({
    userId,
    hubId,
    status: { $in: ['waiting', 'notified'] },
  });
  if (existing) {
    return NextResponse.json({ entry: existing, message: 'You are already on the waitlist' });
  }

  const entry = await Waitlist.create({
    userId,
    hubId,
    hubName: hub.name,
    timePreference,
    classInterest,
    status: 'waiting',
  });

  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  await dbConnect();
  const decoded = verifyStudentToken(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const entryId = body.entryId || request.nextUrl.searchParams.get('entryId');
  if (!entryId) {
    return NextResponse.json({ error: 'entryId is required' }, { status: 400 });
  }

  const entry = await Waitlist.findOne({ _id: entryId, userId: decoded.userId });
  if (!entry) {
    return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
  }

  entry.status = 'cancelled';
  await entry.save();
  return NextResponse.json({ success: true });
}
