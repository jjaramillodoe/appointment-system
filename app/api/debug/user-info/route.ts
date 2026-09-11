import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, isAdmin, isSuperAdmin } from '@/lib/adminPermissions';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('Debug - Token:', token.substring(0, 30) + '...');

    const adminUser = verifyAdminToken(token);
    console.log('Debug - Verified User:', adminUser);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Failed to verify token', token: token.substring(0, 30) + '...' },
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
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
