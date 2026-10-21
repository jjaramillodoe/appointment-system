import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import { buildAdminAppointmentQuery } from '@/lib/adminAppointmentFilters';
import { appointmentStatusLabel } from '@/lib/appointmentStatus';
import { calendarDateFromValue } from '@/lib/appointmentTime';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { csvCell } from '@/lib/csv';

const MAX_ROWS = 10_000;

const COLUMNS: [string, (apt: any) => unknown][] = [
  ['Date', (apt) => calendarDateFromValue(apt.appointmentDate)],
  ['Time', (apt) => apt.appointmentTime],
  ['Hub', (apt) => apt.hubName],
  ['First name', (apt) => apt.userId?.firstName],
  ['Last name', (apt) => apt.userId?.lastName],
  ['Email', (apt) => apt.userId?.email],
  ['Phone', (apt) => apt.userId?.phone],
  ['Program', (apt) => apt.classInterest],
  ['Time preference', (apt) => apt.timePreference],
  ['Status', (apt) => appointmentStatusLabel(apt.status)],
  ['Profile complete', (apt) => (apt.userId?.profileCompleted ? 'Yes' : 'No')],
  ['Checked in', (apt) => apt.checkedInAt?.toISOString()],
  ['Completed', (apt) => apt.completedAt?.toISOString()],
  ['Notes', (apt) => apt.notes],
  ['Admin notes', (apt) => apt.adminNotes],
  ['Booked at', (apt) => apt.createdAt?.toISOString()],
];

// GET - CSV of every appointment matching the admin table's current filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const query = await buildAdminAppointmentQuery(adminUser, request.nextUrl.searchParams);
    if ('error' in query) {
      return NextResponse.json({ error: query.error }, { status: 403 });
    }

    const appointments = await Appointment.find(query.filter)
      .populate('userId', 'firstName lastName email phone profileCompleted')
      .sort(query.sort)
      .limit(MAX_ROWS + 1)
      .lean();
    if (appointments.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `More than ${MAX_ROWS.toLocaleString()} appointments match. Narrow the date range and try again.` },
        { status: 413 }
      );
    }

    const lines = [
      COLUMNS.map(([header]) => csvCell(header)).join(','),
      ...appointments.map((apt) => COLUMNS.map(([, read]) => csvCell(read(apt))).join(',')),
    ];

    // Exports contain student contact details, so record who pulled them
    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'export',
      resourceType: 'appointment',
      description: `Exported ${appointments.length} appointment(s) to CSV`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    const stamp = new Date().toISOString().slice(0, 10);
    // BOM so Excel reads accented names (e.g. "Peña") as UTF-8
    return new NextResponse(`﻿${lines.join('\r\n')}\r\n`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="appointments-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('Appointment export error:', error);
    return NextResponse.json({ error: 'Failed to export appointments' }, { status: 500 });
  }
}
