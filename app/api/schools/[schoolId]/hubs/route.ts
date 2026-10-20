import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { listHubsForSchool } from '@/lib/enrollment';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    await dbConnect();

    const result = await listHubsForSchool(schoolId);
    if (!result) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({
      school: result.school,
      hubs: result.hubs,
    });
  } catch (error) {
    logger.error('Failed to list hubs for school:', error);
    return NextResponse.json({ error: 'Failed to list hubs for school' }, { status: 500 });
  }
}
