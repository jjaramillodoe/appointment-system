import { NextResponse } from 'next/server';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { seedEnrollmentCatalog } from '@/lib/enrollmentSeed';

export async function POST() {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    await dbConnect();
    const seeded = await seedEnrollmentCatalog();
    return NextResponse.json({
      message: 'Enrollment catalog seeded',
      seeded,
    });
  } catch (error) {
    logger.error('Failed to seed enrollment catalog:', error);
    return NextResponse.json({ error: 'Failed to seed enrollment catalog' }, { status: 500 });
  }
}
