import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { dueReminderHours } from '@/lib/reminderService';
import { appointmentStartDateTime } from '@/lib/slotDateTime';

const tz = 'America/New_York';
const start = DateTime.fromISO('2026-10-22T10:00', { zone: tz });
const at = (iso: string) => DateTime.fromISO(iso, { zone: tz });
const longAgo = new Date('2026-10-01T00:00:00Z');

test('start time: UTC-midnight date + wall clock', () => {
  const dt = appointmentStartDateTime(new Date('2026-10-22T00:00:00.000Z'), '9:00 PM', tz);
  assert.equal(dt.toFormat('yyyy-MM-dd HH:mm'), '2026-10-22 21:00');
});

test('start time: legacy exact-instant storage', () => {
  const dt = appointmentStartDateTime(new Date('2026-10-23T01:00:00.000Z'), '9:00 PM', tz);
  assert.equal(dt.toFormat('yyyy-MM-dd HH:mm'), '2026-10-22 21:00');
});

test('reminder not due before its lead time', () => {
  assert.equal(dueReminderHours(start, longAgo, at('2026-10-21T04:00'), [24, 1]), null);
});

test('24h reminder due inside the 24h window', () => {
  assert.equal(dueReminderHours(start, longAgo, at('2026-10-21T11:00'), [24, 1]), 24);
});

test('closest due reminder wins', () => {
  assert.equal(dueReminderHours(start, longAgo, at('2026-10-22T09:30'), [24, 1]), 1);
  assert.equal(dueReminderHours(start, longAgo, at('2026-10-21T20:00'), [48, 24]), 24);
});

test('nothing due after the appointment starts', () => {
  assert.equal(dueReminderHours(start, longAgo, at('2026-10-22T10:01'), [24, 1]), null);
});

test('late bookings skip reminders whose send time already passed', () => {
  const bookedAt = at('2026-10-22T07:00').toJSDate();
  assert.equal(dueReminderHours(start, bookedAt, at('2026-10-22T07:05'), [24, 1]), null);
  assert.equal(dueReminderHours(start, bookedAt, at('2026-10-22T09:05'), [24, 1]), 1);
});
