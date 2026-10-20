import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Hub from '@/models/Hub';
import { verifyAdminToken, isSuperAdmin } from '@/lib/adminPermissions';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(authHeader.substring(7));
    if (!isSuperAdmin(adminUser)) {
      return NextResponse.json({ error: 'Only super admins can list all hubs' }, { status: 403 });
    }

    await dbConnect();

    const hubs = await Hub.find({ isActive: true }).select('_id name location');

    return NextResponse.json({
      hubs: hubs.map(hub => ({
        _id: hub._id,
        name: hub.name,
        location: hub.location
      }))
    });
  } catch (error: any) {
    logger.error('List hubs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
