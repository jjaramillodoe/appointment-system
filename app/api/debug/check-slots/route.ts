import { NextRequest, NextResponse } from 'next/server';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import dbConnect from '@/lib/mongodb';
import AppointmentSlot from '@/models/AppointmentSlot';

export async function GET(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    await dbConnect();

    const totalSlots = await AppointmentSlot.countDocuments();
    const slotsWithCapacity = await AppointmentSlot.countDocuments({ $expr: { $lt: ['$bookedCount', '$capacity'] } });

    let sample = null;
    if (totalSlots > 0) {
      sample = await AppointmentSlot.findOne().lean();
    }

    return NextResponse.json({
      totalSlots,
      slotsWithCapacity,
      sample,
    });
  } catch (error: any) {
    console.error('Check slots error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
