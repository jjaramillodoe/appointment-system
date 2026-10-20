import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { executeArchive, parseArchiveThreshold } from '@/lib/maintenanceArchive';
import {
  ARCHIVE_CONFIRMATION,
  confirmationMismatch,
  denyIfProductionLocked,
  PURGE_CONFIRMATION,
  requireSuperAdmin,
  withProductionFlag,
} from '@/lib/maintenanceGuard';

export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const body = await request.json().catch(() => ({}));
    const olderThan = parseArchiveThreshold(body.olderThan);
    if (!olderThan) {
      return NextResponse.json({ error: 'olderThan must be 6_months, 1_year, 2_years, or 3_years' }, { status: 400 });
    }

    const confirmationError = confirmationMismatch(
      body.confirmationText,
      [ARCHIVE_CONFIRMATION, PURGE_CONFIRMATION],
    );
    if (confirmationError) return confirmationError;

    const purge = body.confirmationText === PURGE_CONFIRMATION || body.purge === true;
    if (purge && olderThan !== '3_years') {
      return NextResponse.json({
        error: 'Permanent purge is only allowed for the 3-year retention threshold.',
      }, { status: 400 });
    }

    const productionError = denyIfProductionLocked(body.confirmProduction);
    if (productionError) return productionError;

    await dbConnect();
    const result = await executeArchive({
      olderThan,
      purge,
      archivedBy: adminUser.email,
    });

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'bulk_action',
      resourceType: 'other',
      resourceName: purge ? 'maintenance-archive-purge' : 'maintenance-archive-execute',
      description: purge
        ? `Permanently purged records older than 3 years`
        : `Archived records older than ${olderThan}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
      metadata: result,
    });

    return NextResponse.json(withProductionFlag({
      message: purge
        ? 'Eligible records older than 3 years were permanently purged.'
        : 'Eligible records were moved into archive collections.',
      result,
    }));
  } catch (error: any) {
    logger.error('Maintenance archive execute failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute archival' },
      { status: 500 }
    );
  }
}
