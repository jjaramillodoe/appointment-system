import './env';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function resetDatabase() {
  await dbConnect();
  await mongoose.connection.db!.dropDatabase();
  return mongoose.connection.db!;
}

export async function disconnect() {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
}

export const oid = () => new mongoose.Types.ObjectId();

export function tokenFor(userId: mongoose.Types.ObjectId) {
  return jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET!);
}

export function request(
  url: string,
  options: { method?: string; userId?: mongoose.Types.ObjectId; body?: unknown } = {}
) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.userId) headers.authorization = `Bearer ${tokenFor(options.userId)}`;
  return new NextRequest(`http://test${url}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/** YYYY-MM-DD for a weekday at least `minDaysAhead` days out, in the hub timezone. */
export async function upcomingWeekday(minDaysAhead = 2) {
  const { DateTime } = await import('luxon');
  let day = DateTime.now().setZone('America/New_York').plus({ days: minDaysAhead });
  while (day.weekday > 5) day = day.plus({ days: 1 });
  return day.toISODate()!;
}
