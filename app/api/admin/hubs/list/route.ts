import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Hub from '@/models/Hub';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const hubs = await Hub.find({ isActive: true }).select('_id name location');

    return NextResponse.json({
      hubs: hubs.map(hub => ({
        id: hub._id,
        name: hub.name,
        location: hub.location
      }))
    });

  } catch (error: any) {
    console.error('List hubs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
