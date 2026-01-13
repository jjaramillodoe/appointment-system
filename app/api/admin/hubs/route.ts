import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Hub from '../../../../models/Hub';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // Build query
    const query = activeOnly ? { isActive: true } : {};
    
    // Fetch hubs with basic info
    const hubs = await Hub.find(query)
      .select('name location defaultSlots timezone isActive')
      .sort({ name: 1 })
      .lean();
    
    return NextResponse.json(hubs);
  } catch (error) {
    console.error('Admin hubs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, location, defaultSlots, timezone = 'America/New_York' } = body;
    
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }
    
    const hub = new Hub({
      name,
      location,
      defaultSlots: defaultSlots || ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
      timezone,
      isActive: true
    });
    
    const savedHub = await hub.save();
    
    return NextResponse.json({
      success: true,
      hub: savedHub
    });
  } catch (error: any) {
    console.error('Create hub error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Hub with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 