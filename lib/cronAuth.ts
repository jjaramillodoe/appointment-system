import { NextRequest } from 'next/server';

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without a secret, only allow outside production. */
export function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}
