import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { clampReseedOptions, reseedAnalyticsData } from '@/lib/maintenanceReseed';
import {
  confirmationMismatch,
  denyIfProductionLocked,
  RESEED_CONFIRMATION,
  requireSuperAdmin,
  withProductionFlag,
} from '@/lib/maintenanceGuard';

export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const body = await request.json().catch(() => ({}));
    const confirmationError = confirmationMismatch(body.confirmationText, RESEED_CONFIRMATION);
    if (confirmationError) return confirmationError;

    const productionError = denyIfProductionLocked(body.confirmProduction);
    if (productionError) return productionError;

    await dbConnect();
    const options = clampReseedOptions(body);
    const created = await reseedAnalyticsData(options);

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'bulk_action',
      resourceType: 'other',
      resourceName: 'maintenance-reseed-data',
      description: `Reseeded ${created.users} students and ${created.appointments} appointments`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
      metadata: created,
    });

    return NextResponse.json(withProductionFlag({
      message: 'Realistic analytics data was added.',
      created,
    }));
  } catch (error: any) {
    logger.error('Maintenance reseed-data failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reseed analytics data' },
      { status: 500 }
    );
  }
}
