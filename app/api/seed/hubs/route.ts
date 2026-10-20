import { logger } from '@/lib/logger';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import { NextRequest, NextResponse } from 'next/server';
import Hub from '@/models/Hub';
import dbConnect from '@/lib/mongodb';

const SAMPLE_HUBS = [
  {
    name: 'P.S. 13 Roberto Clemente',
    location: '557 Pennsylvania Avenue, Brooklyn, NY 11207',
    timezone: 'America/New_York',
    defaultSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '17:00', '18:00'],
    isActive: true,
  },
  {
    name: 'Adult Education at Coney Island Avenue',
    location: '1223 Coney Island Avenue, Brooklyn, NY 11230',
    timezone: 'America/New_York',
    defaultSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '17:00', '18:00'],
    isActive: true,
  },
  {
    name: 'P.S. 6 Norma Adams Clemons Academy',
    location: '43 Snyder Avenue, Brooklyn, NY 11226',
    timezone: 'America/New_York',
    defaultSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '17:00'],
    isActive: true,
  },
  {
    name: 'I.S. 259 Abraham Lincoln',
    location: '528 Ridgewood Avenue, Brooklyn, NY 11208',
    timezone: 'America/New_York',
    defaultSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '17:00', '18:00'],
    isActive: true,
  },
  {
    name: 'Bronx Adult Learning Center',
    location: '3450 East Tremont Avenue, 3rd Floor, Bronx, NY 10465',
    timezone: 'America/New_York',
    defaultSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '17:00', '18:00'],
    isActive: true,
  },
];

export async function POST(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    await dbConnect();

    // Check if hubs already exist
    const existingCount = await Hub.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json(
        { message: `Hubs already seeded (${existingCount} exist)`, skipped: true },
        { status: 200 }
      );
    }

    // Insert sample hubs
    const result = await Hub.insertMany(SAMPLE_HUBS);
    logger.debug(`✅ Seeded ${result.length} hubs`);

    return NextResponse.json(
      {
        message: `Successfully seeded ${result.length} hubs`,
        hubs: result.map((hub: any) => ({ id: hub._id, name: hub.name })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('❌ Seeding error:', error);
    return NextResponse.json(
      { error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check seed status
export async function GET(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    await dbConnect();
    const count = await Hub.countDocuments();

    return NextResponse.json(
      {
        message: `Database has ${count} hubs`,
        hubsSeeded: count > 0,
        hubCount: count,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('❌ Error checking hubs:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
