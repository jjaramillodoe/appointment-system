import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { parseArchiveThreshold, previewArchive } from '@/lib/maintenanceArchive';
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
    const preview = await previewArchive(olderThan);
    return NextResponse.json(withProductionFlag(preview));
  } catch (error) {
    logger.error('Maintenance archive preview failed:', error);
    return NextResponse.json({ error: 'Failed to preview archive candidates' }, { status: 500 });
  }
}
