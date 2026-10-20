import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin, isSuperAdmin as checkSuperAdmin } from '@/lib/adminPermissions';
import BlackoutDate from '@/models/BlackoutDate';
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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const blackoutDates = await BlackoutDate.find(query)
      .populate('affectedHubs', 'name')
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: 1 });

    return NextResponse.json({ blackoutDates });
  } catch (error: any) {
    console.error('Get blackout dates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get blackout dates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { date, title, description, type, affectedHubs, isAllDay, startTime, endTime } = body;

    if (!date || !title) {
      return NextResponse.json(
        { error: 'Date and title are required' },
        { status: 400 }
      );
    }

    const blackoutDate = new BlackoutDate({
      date: new Date(date),
      title,
      description,
      type,
      affectedHubs: affectedHubs && affectedHubs.length > 0 ? affectedHubs : [],
      isAllDay,
      startTime,
      endTime,
      createdBy: adminUser.userId,
    });

    await blackoutDate.save();

    return NextResponse.json({
      success: true,
      message: 'Blackout date created',
      blackoutDate,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create blackout date error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create blackout date' },
      { status: 500 }
    );
  }
}
