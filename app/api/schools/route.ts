import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { listActiveSchools } from '@/lib/enrollment';

export async function GET() {
  try {
    await dbConnect();
    const schools = await listActiveSchools();
    return NextResponse.json({ schools });
  } catch (error) {
    logger.error('Failed to list schools:', error);
    return NextResponse.json({ error: 'Failed to list schools' }, { status: 500 });
  }
}
