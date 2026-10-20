import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '@/lib/availabilityService';
import { verifyStudentToken } from '@/lib/studentAuth';
import { canAccessHub, isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { isDateClosed } from '@/lib/closures';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId');
    const hubIds = searchParams.get('hubIds');
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Date must be in YYYY-MM-DD format' }, { status: 400 });
    }

    let availability;

    if (hubIds) {
      availability = await AvailabilityService.getMultiHubAvailability(
        hubIds.split(',').map((id) => id.trim()),
        date
      );
    } else if (hubId) {
      availability = await AvailabilityService.getAvailability(hubId, date);
    } else {
      return NextResponse.json({ error: 'Either hubId or hubIds parameter is required' }, { status: 400 });
    }

    if (hubId && availability && !Array.isArray(availability) && !availability.isDayOff) {
      const closed = await isDateClosed(hubId, date);
      if (closed.closed) {
        availability = {
          ...availability,
          slots: [],
          isDayOff: true,
          dayOffReason: closed.reason,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    logger.error('Availability API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const ADMIN_ACTIONS = new Set(['markDayOff', 'markDayOpen', 'updateSlots', 'preGenerate']);
const STUDENT_ACTIONS = new Set(['book', 'cancel']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, hubId, date, time, userId, slots, reason, classInterest } = body;

    if (!hubId || !date) {
      return NextResponse.json({ error: 'hubId and date are required' }, { status: 400 });
    }

    if (ADMIN_ACTIONS.has(action)) {
      const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
      if (!isAdmin(adminUser) || !adminUser || !canAccessHub(adminUser, hubId)) {
        return NextResponse.json({ error: 'Admin access required for schedule changes' }, { status: 403 });
      }
    } else if (STUDENT_ACTIONS.has(action)) {
      const student = verifyStudentToken(request.headers.get('authorization'));
      if (!student) {
        return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
      }
      if (userId && userId !== student.userId) {
        return NextResponse.json({ error: 'You can only book or cancel your own appointment' }, { status: 403 });
      }
    } else {
      return NextResponse.json({
        error: 'Invalid action. Supported: book, cancel, markDayOff, markDayOpen, updateSlots, preGenerate',
      }, { status: 400 });
    }

    let result: any = false;

    switch (action) {
      case 'book':
        if (!time || !userId) {
          return NextResponse.json({ error: 'time and userId are required for booking' }, { status: 400 });
        }
        result = await AvailabilityService.bookSlot(hubId, date, time, userId, classInterest);
        break;
      case 'cancel':
        if (!time || !userId) {
          return NextResponse.json({ error: 'time and userId are required for cancellation' }, { status: 400 });
        }
        result = await AvailabilityService.cancelBooking(hubId, date, time, userId);
        result = result ? { success: true } : { success: false, error: 'Cancellation failed' };
        break;
      case 'markDayOff':
        result = await AvailabilityService.markDayOff(hubId, date, reason);
        result = result ? { success: true } : { success: false, error: 'Failed to mark day off' };
        break;
      case 'markDayOpen':
        result = await AvailabilityService.markDayOpen(hubId, date);
        result = result ? { success: true } : { success: false, error: 'Failed to mark day as open' };
        break;
      case 'updateSlots':
        if (!slots || !Array.isArray(slots)) {
          return NextResponse.json({ error: 'slots array is required for updating slots' }, { status: 400 });
        }
        result = await AvailabilityService.updateDaySlots(hubId, date, slots);
        result = result ? { success: true } : { success: false, error: 'Failed to update slots' };
        break;
      case 'preGenerate': {
        const { endDate } = body;
        if (!endDate) {
          return NextResponse.json({ error: 'endDate is required for pre-generation' }, { status: 400 });
        }
        await AvailabilityService.preGenerateAvailability(hubId, date, endDate);
        result = { success: true };
        break;
      }
    }

    if (ADMIN_ACTIONS.has(action) && result?.success) {
      const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
      if (adminUser) {
        await logAuditEvent({
          adminId: adminUser.userId,
          adminEmail: adminUser.email,
          adminName: adminUser.email,
          action: 'update',
          resourceType: 'schedule',
          resourceId: hubId,
          description: `${action} on ${date}${reason ? `: ${reason}` : ''}`,
          ipAddress: getClientIpAddress(request),
          userAgent: getUserAgent(request),
        });
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${action} completed successfully`,
        status: result.status,
        appointmentId: result.appointmentId,
      });
    }

    return NextResponse.json({ error: result.error || `Failed to ${action}` }, { status: 400 });
  } catch (error) {
    logger.error('Availability API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
