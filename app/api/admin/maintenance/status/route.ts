import { NextRequest, NextResponse } from 'next/server';
import { isProductionEnvironment, requireSuperAdmin, withProductionFlag } from '@/lib/maintenanceGuard';

export async function GET(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;

  return NextResponse.json(withProductionFlag({
    environment: process.env.NODE_ENV || 'development',
    destructiveLocked: isProductionEnvironment(),
  }));
}
