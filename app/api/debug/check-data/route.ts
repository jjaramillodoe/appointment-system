import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get sample appointments
    const appointments = await Appointment.find({})
      .select('hubName appointmentDate appointmentTime')
      .limit(5)
      .lean();

    // Get sample appointment slots
    const slots = await AppointmentSlot.find({})
      .select('hubName date time')
      .limit(5)
      .lean();

    // Count totals
    const appointmentCount = await Appointment.countDocuments();
    const slotCount = await AppointmentSlot.countDocuments();

    // Get distinct hubs from appointments
    const appointmentHubs = await Appointment.distinct('hubName');

    // Get distinct hubs from slots
    const slotHubs = await AppointmentSlot.distinct('hubName');

    return NextResponse.json({
      appointmentCount,
      slotCount,
      appointmentHubs,
      slotHubs,
      sampleAppointments: appointments,
      sampleSlots: slots,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
