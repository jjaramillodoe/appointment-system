import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isSuperAdmin as checkSuperAdmin } from '@/lib/adminPermissions';
import BlackoutDate from '@/models/BlackoutDate';
import { AdminUser } from '@/lib/adminPermissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();

    const blackoutDate = await BlackoutDate.findById(id)
      .populate('affectedHubs', 'name')
      .populate('createdBy', 'firstName lastName email');

    if (!blackoutDate) {
      return NextResponse.json(
        { error: 'Blackout date not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ blackoutDate });
  } catch (error: any) {
    console.error('Get blackout date error:', error);
    return NextResponse.json(
      { error: 'Failed to get blackout date' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const adminUser = verifyAdminToken(token) as AdminUser;

    if (!checkSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, title, description, type, affectedHubs, isAllDay, startTime, endTime } = body;

    const updateData: any = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (affectedHubs !== undefined) updateData.affectedHubs = affectedHubs;
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;

    const blackoutDate = await BlackoutDate.findByIdAndUpdate(id, updateData, { new: true })
      .populate('affectedHubs', 'name')
      .populate('createdBy', 'firstName lastName email');

    if (!blackoutDate) {
      return NextResponse.json(
        { error: 'Blackout date not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blackout date updated',
      blackoutDate,
    });
  } catch (error: any) {
    console.error('Update blackout date error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update blackout date' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const adminUser = verifyAdminToken(token);

    if (!checkSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const blackoutDate = await BlackoutDate.findByIdAndDelete(id);

    if (!blackoutDate) {
      return NextResponse.json(
        { error: 'Blackout date not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blackout date deleted',
    });
  } catch (error: any) {
    console.error('Delete blackout date error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete blackout date' },
      { status: 500 }
    );
  }
}
