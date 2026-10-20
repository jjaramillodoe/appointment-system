import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { clearOperationalData } from '@/lib/maintenanceArchive';
import {
  CLEAR_DATA_CONFIRMATION,
  confirmationMismatch,
  denyIfProductionLocked,
  requireSuperAdmin,
  withProductionFlag,
} from '@/lib/maintenanceGuard';

export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const body = await request.json().catch(() => ({}));
    const confirmationError = confirmationMismatch(body.confirmationText, CLEAR_DATA_CONFIRMATION);
    if (confirmationError) return confirmationError;

    const productionError = denyIfProductionLocked(body.confirmProduction);
    if (productionError) return productionError;

    await dbConnect();
    const deleted = await clearOperationalData();

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'bulk_action',
      resourceType: 'other',
      resourceName: 'maintenance-clear-data',
      description: 'Cleared operational data while preserving super admin accounts',
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
      metadata: deleted,
    });

    return NextResponse.json(withProductionFlag({
      message: 'Operational data cleared. Super admin accounts were preserved.',
      deleted,
    }));
  } catch (error) {
    logger.error('Maintenance clear-data failed:', error);
    return NextResponse.json({ error: 'Failed to clear operational data' }, { status: 500 });
  }
}
