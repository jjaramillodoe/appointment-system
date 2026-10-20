import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isSuperAdmin as checkSuperAdmin } from '@/lib/adminPermissions';
import AuditLog from '@/models/AuditLog';
import { AdminUser } from '@/lib/adminPermissions';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const adminUser = await verifyAdminToken(token) as AdminUser;

    if (!checkSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const adminEmail = searchParams.get('adminEmail');
    const resourceId = searchParams.get('resourceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build filter query
    let query: any = {};

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (adminEmail) query.adminEmail = { $regex: adminEmail, $options: 'i' };
    if (resourceId) query.resourceId = resourceId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await AuditLog.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
