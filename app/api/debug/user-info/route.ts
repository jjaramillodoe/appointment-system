import { logger } from '@/lib/logger';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, isAdmin, isSuperAdmin } from '@/lib/adminPermissions';

export async function GET(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const adminUser = await verifyAdminToken(token);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Failed to verify token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: adminUser,
      checks: {
        isAdmin: isAdmin(adminUser),
        isSuperAdmin: isSuperAdmin(adminUser),
      },
    });
  } catch (error: any) {
    logger.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
