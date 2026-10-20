import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Waitlist from '@/models/Waitlist';
import { isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { resolveRequestedHub } from '@/lib/adminUserAccess';

export async function GET(request: NextRequest) {
  await dbConnect();
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const hubName = request.nextUrl.searchParams.get('hubName');
  const scope = await resolveRequestedHub(adminUser, hubName);
  if (scope.error) {
    return NextResponse.json({ error: scope.error }, { status: 403 });
  }

  const filter: Record<string, unknown> = { status: { $in: ['waiting', 'notified'] } };
  if (scope.hub) {
    filter.hubName = scope.hub.name;
  }

  const entries = await Waitlist.find(filter)
    .populate('userId', 'firstName lastName email phone')
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ entries });
}

export async function PATCH(request: NextRequest) {
  await dbConnect();
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { entryId, action } = await request.json();
  if (!entryId || (action !== 'notify' && action !== 'remove')) {
    return NextResponse.json({ error: 'entryId and action (notify or remove) are required' }, { status: 400 });
  }

  const entry = await Waitlist.findById(entryId);
  if (!entry) {
    return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
  }

  const scope = await resolveRequestedHub(adminUser, entry.hubName);
  if (scope.error) {
    return NextResponse.json({ error: scope.error }, { status: 403 });
  }
  if (scope.hub && scope.hub.name !== entry.hubName) {
    return NextResponse.json({ error: 'You can only manage the waitlist for your hub' }, { status: 403 });
  }

  if (action === 'remove') {
    entry.status = 'cancelled';
    await entry.save();
    return NextResponse.json({ success: true, entry });
  }

  entry.status = 'notified';
  await entry.save();
  const { notifyWaitlistEntry } = await import('@/lib/waitlistService');
  await notifyWaitlistEntry(entry, entry.hubName);
  return NextResponse.json({ success: true, entry });
}
