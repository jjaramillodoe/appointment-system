import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Delete all appointments
    const result = await Appointment.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} appointments`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
