import { NextRequest, NextResponse } from 'next/server';
import Hub from '@/models/Hub';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const classInterest = searchParams.get('classInterest');
    const timePreference = searchParams.get('timePreference');

    if (!classInterest || !timePreference) {
      return NextResponse.json(
        { error: 'classInterest and timePreference are required' },
        { status: 400 }
      );
    }

    // For now, return all active hubs
    // In production, this would filter based on available schedules
    const hubs = await Hub.find({ active: true }).limit(10);

    if (!hubs || hubs.length === 0) {
      return NextResponse.json(
        { hubs: [], message: 'No hubs available for selected options' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        hubs: hubs.map((hub: any) => ({
          _id: hub._id,
          name: hub.name,
          address: hub.address,
          phone: hub.phone,
          email: hub.email,
          capacity: hub.capacity,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching hubs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hubs' },
      { status: 500 }
    );
  }
}
