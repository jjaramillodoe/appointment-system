import { NextResponse } from 'next/server';

/**
 * Seed and debug routes mutate or expose data without real auth checks.
 * Hide them entirely outside local development (Vercel previews run as production too).
 */
export function blockOutsideDevelopment(): NextResponse | null {
  if (process.env.NODE_ENV === 'development') return null;
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
