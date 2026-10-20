import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { resolveRequestedHub } from '@/lib/adminUserAccess';
import { ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_STATUS } from '@/lib/appointmentStatus';
import { hubCalendarToday, utcDayBounds } from '@/lib/slotDateTime';

export async function GET(request: NextRequest) {
  await dbConnect();
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const date = request.nextUrl.searchParams.get('date') || hubCalendarToday();
  const hubName = request.nextUrl.searchParams.get('hubName');
  const scope = await resolveRequestedHub(adminUser, hubName);
  if (scope.error) {
    return NextResponse.json({ error: scope.error }, { status: 403 });
  }

  const { start: dayStart, end: dayEnd } = utcDayBounds(date);

  const filter: Record<string, unknown> = {
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: [...ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.NO_SHOW] },
  };
  if (Object.keys(scope.appointmentFilter).length) {
    filter.$and = [scope.appointmentFilter];
  }

  const appointments = await Appointment.find(filter)
    .populate('userId', 'firstName lastName email phone programInterests profileCompleted')
    .sort({ appointmentTime: 1 })
    .lean();

  return NextResponse.json({
    date,
    hubName: scope.hub?.name || hubName || 'All hubs',
    appointments: appointments.map((apt: any) => ({
      _id: apt._id,
      time: apt.appointmentTime,
      status: apt.status,
      hubName: apt.hubName,
      classInterest: apt.classInterest,
      firstName: apt.userId?.firstName || '',
      lastName: apt.userId?.lastName || '',
      email: apt.userId?.email || '',
      phone: apt.userId?.phone || '',
      profileCompleted: Boolean(apt.userId?.profileCompleted),
    })),
  });
}
