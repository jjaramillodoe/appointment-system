import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const hubName = 'Adult Education at Coney Island Avenue';
    const date = '2026-09-01';

    // Check slots for this hub and date
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const slots = await AppointmentSlot.find({
      hubName,
      date: { $gte: startDate, $lt: endDate }
    }).select('hubName date time').limit(3).lean();

    // Check appointments for this hub and date
    const appointments = await Appointment.find({
      hubName,
      appointmentDate: { $gte: startDate, $lt: endDate }
    }).select('hubName appointmentDate appointmentTime').limit(5).lean();

    // Check all appointments for this hub (any date)
    const allApptsForHub = await Appointment.countDocuments({ hubName });

    // Check all distinct hub names in appointments
    const hubNames = await Appointment.distinct('hubName');

    // Get one sample appointment
    const sampleAppt = await Appointment.findOne().select('hubName appointmentDate appointmentTime').lean();

    return NextResponse.json({
      query: { hubName, date },
      slotsFound: slots.length,
      sampleSlots: slots,
      appointmentsFound: appointments.length,
      sampleAppointments: appointments,
      allApptsForHub,
      hubNamesInDb: hubNames,
      sampleAppointment: sampleAppt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
