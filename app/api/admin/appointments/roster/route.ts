import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Hub from '@/models/Hub';
import { isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { resolveRequestedHub } from '@/lib/adminUserAccess';
import { ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_STATUS } from '@/lib/appointmentStatus';
import { appointmentStartDateTime, getHubTimezone, hubCalendarToday, utcDayBounds } from '@/lib/slotDateTime';
import { parseClockToMinutes } from '@/lib/timePreference';

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
    .lean();

  // Sort by clock time; a string sort puts "10:00 AM" before "9:00 AM"
  appointments.sort((a: any, b: any) =>
    (parseClockToMinutes(a.appointmentTime || '') ?? 0) - (parseClockToMinutes(b.appointmentTime || '') ?? 0));

  const timezones = new Map<string, string>();
  const hubs = await Hub.find({ name: { $in: [...new Set(appointments.map((apt: any) => apt.hubName).filter(Boolean))] } })
    .select('name timezone')
    .lean();
  for (const hub of hubs as any[]) timezones.set(hub.name, getHubTimezone(hub.timezone));

  return NextResponse.json({
    date,
    hubName: scope.hub?.name || hubName || 'All hubs',
    appointments: appointments.map((apt: any) => ({
      _id: apt._id,
      userId: apt.userId?._id,
      time: apt.appointmentTime,
      startsAt: appointmentStartDateTime(
        apt.appointmentDate,
        apt.appointmentTime,
        timezones.get(apt.hubName) || getHubTimezone()
      ).toISO(),
      checkedInAt: apt.checkedInAt || null,
      completedAt: apt.completedAt || null,
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
