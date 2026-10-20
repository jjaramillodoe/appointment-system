import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { listAvailableClasses } from '@/lib/enrollment';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const schoolId = request.nextUrl.searchParams.get('schoolId');
    const hubId = request.nextUrl.searchParams.get('hubId');
    const result = await listAvailableClasses({ schoolId, hubId });

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ classes: result.classes || [] });
  } catch (error) {
    logger.error('Failed to list classes:', error);
    return NextResponse.json({ error: 'Failed to list classes' }, { status: 500 });
  }
}
