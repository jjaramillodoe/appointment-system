import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { resolveRequestedHub } from '@/lib/adminUserAccess';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { utcDayBounds } from '@/lib/slotDateTime';

function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(request: NextRequest) {
  await dbConnect();
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser) || !adminUser) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const hubName = searchParams.get('hubName');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const format = searchParams.get('format');

  const scope = await resolveRequestedHub(adminUser, hubName);
  if (scope.error) {
    return NextResponse.json({ error: scope.error }, { status: 403 });
  }

  const conditions: Record<string, unknown>[] = [];
  if (Object.keys(scope.appointmentFilter).length) {
    conditions.push(scope.appointmentFilter);
  }
  if (startDate || endDate) {
    const appointmentDate: Record<string, Date> = {};
    if (startDate) appointmentDate.$gte = utcDayBounds(startDate).start;
    if (endDate) appointmentDate.$lt = utcDayBounds(endDate).end;
    conditions.push({ appointmentDate });
  }

  const filter = conditions.length ? { $and: conditions } : {};
  const appointments = await Appointment.find(filter)
    .populate('userId', 'firstName lastName email phone profileCompleted programInterests')
    .sort({ appointmentDate: -1 })
    .lean();

  const byStatus: Record<string, number> = {};
  const byHub: Record<string, number> = {};
  const byProgram: Record<string, number> = {};
  let incompleteProfiles = 0;
  let noShows = 0;

  for (const apt of appointments as any[]) {
    byStatus[apt.status] = (byStatus[apt.status] || 0) + 1;
    byHub[apt.hubName || 'Unknown'] = (byHub[apt.hubName || 'Unknown'] || 0) + 1;
    byProgram[apt.classInterest || 'Unspecified'] = (byProgram[apt.classInterest || 'Unspecified'] || 0) + 1;
    if (apt.userId && !apt.userId.profileCompleted) incompleteProfiles += 1;
    if (apt.status === 'no_show') noShows += 1;
  }

  const summary = {
    total: appointments.length,
    byStatus,
    byHub,
    byProgram,
    incompleteProfiles,
    noShowRate: appointments.length ? Math.round((noShows / appointments.length) * 100) : 0,
  };

  if (format === 'csv') {
    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'export',
      resourceType: 'appointment',
      description: `Exported appointment report (${appointments.length} rows)`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    const header = ['Date', 'Time', 'Hub', 'Status', 'Student', 'Email', 'Phone', 'Program', 'Profile complete'];
    const rows = appointments.map((apt: any) => [
      apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().slice(0, 10) : '',
      apt.appointmentTime || '',
      apt.hubName || '',
      apt.status || '',
      [apt.userId?.firstName, apt.userId?.lastName].filter(Boolean).join(' '),
      apt.userId?.email || '',
      apt.userId?.phone || '',
      apt.classInterest || '',
      apt.userId?.profileCompleted ? 'yes' : 'no',
    ].map(csvEscape).join(','));

    return new NextResponse([header.join(','), ...rows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="appointments-report.csv"`,
      },
    });
  }

  const incompleteUsers = await User.countDocuments({
    isAdmin: { $ne: true },
    profileCompleted: { $ne: true },
  });

  return NextResponse.json({
    summary: { ...summary, districtIncompleteProfiles: incompleteUsers },
    appointments: appointments.slice(0, 100),
  });
}
