import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { createRegistrationSchema } from '@/lib/enrollmentSchema';
import { createStudentRegistration } from '@/lib/enrollment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid registration payload',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 });
    }

    await dbConnect();
    const result = await createStudentRegistration(parsed.data);
    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      message: 'Registration submitted',
      registration: result.registration,
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create registration:', error);
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
  }
}
