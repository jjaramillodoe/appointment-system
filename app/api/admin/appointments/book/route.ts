import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Hub from '@/models/Hub';
import { isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { canAccessHub } from '@/lib/adminPermissions';
import { assertCanViewUser } from '@/lib/adminUserAccess';
import { AvailabilityService } from '@/lib/availabilityService';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { isDateClosed } from '@/lib/closures';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, hubId, date, time, classInterest } = await request.json();
    if (!userId || !hubId || !date || !time) {
      return NextResponse.json({ error: 'userId, hubId, date, and time are required' }, { status: 400 });
    }

    if (!canAccessHub(adminUser, hubId)) {
      return NextResponse.json({ error: 'You can only book for your assigned hub' }, { status: 403 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const viewError = await assertCanViewUser(adminUser, user);
    if (viewError) {
      return NextResponse.json({ error: viewError }, { status: 403 });
    }

    const hub = await Hub.findById(hubId);
    if (!hub) {
      return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
    }

    const closed = await isDateClosed(hubId, date);
    if (closed.closed) {
      return NextResponse.json({ error: closed.reason || 'That day is closed' }, { status: 409 });
    }

    const result = await AvailabilityService.bookSlot(hubId, date, time, userId, classInterest);
    if (!result.success && String(result.error || '').includes('already has')) {
      const reschedule = await fetch(new URL('/api/appointments/reschedule', request.url), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('authorization') || '',
        },
        body: JSON.stringify({ hubId, date, time, userId }),
      });
      if (reschedule.ok) {
        await logAuditEvent({
          adminId: adminUser.userId,
          adminEmail: adminUser.email,
          adminName: adminUser.email,
          action: 'update',
          resourceType: 'appointment',
          description: `Rescheduled appointment for ${user.email} to ${date} ${time}`,
          ipAddress: getClientIpAddress(request),
          userAgent: getUserAgent(request),
        });
        return NextResponse.json({ success: true, rescheduled: true });
      }
    }
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Booking failed' }, { status: 400 });
    }

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'create',
      resourceType: 'appointment',
      resourceId: result.appointmentId,
      description: `Booked appointment for ${user.email} at ${hub.name} on ${date} ${time}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ success: true, appointmentId: result.appointmentId, status: result.status });
  } catch (error: any) {
    logger.error('Admin book error:', error);
    return NextResponse.json({ error: error.message || 'Failed to book appointment' }, { status: 500 });
  }
}
