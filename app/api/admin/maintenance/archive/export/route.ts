import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { loadArchiveExport, parseArchiveThreshold, toCsv } from '@/lib/maintenanceArchive';
import { requireSuperAdmin, withProductionFlag } from '@/lib/maintenanceGuard';

export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const body = await request.json().catch(() => ({}));
    const olderThan = parseArchiveThreshold(body.olderThan);
    if (!olderThan) {
      return NextResponse.json({ error: 'olderThan must be 6_months, 1_year, 2_years, or 3_years' }, { status: 400 });
    }

    await dbConnect();
    const { cutoff, appointments, slots, users } = await loadArchiveExport(olderThan);
    const format = body.format === 'csv' ? 'csv' : 'json';
    const stamp = cutoff.toISOString().slice(0, 10);

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'export',
      resourceType: 'other',
      resourceName: 'maintenance-archive-export',
      description: `Exported ${appointments.length} appointments and ${users.length} users older than ${olderThan}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
      metadata: { olderThan, format, appointments: appointments.length, users: users.length, slots: slots.length },
    });

    if (format === 'csv') {
      const csv = [
        '# appointments',
        toCsv(appointments as unknown as Array<Record<string, unknown>>),
        '',
        '# slots',
        toCsv(slots as unknown as Array<Record<string, unknown>>),
        '',
        '# users',
        toCsv(users as unknown as Array<Record<string, unknown>>),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="archive-${olderThan}-${stamp}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(withProductionFlag({
      olderThan,
      cutoffDate: cutoff.toISOString(),
      appointments,
      slots,
      users,
    }), null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="archive-${olderThan}-${stamp}.json"`,
      },
    });
  } catch (error) {
    logger.error('Maintenance archive export failed:', error);
    return NextResponse.json({ error: 'Failed to export archive candidates' }, { status: 500 });
  }
}
