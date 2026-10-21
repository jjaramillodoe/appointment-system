import { resetDatabase, disconnect, oid, upcomingWeekday } from '../helpers/db';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Db } from 'mongodb';
import { DateTime } from 'luxon';
import Appointment from '@/models/Appointment';
import Waitlist from '@/models/Waitlist';
import { promoteWaitlist, markWaitlistBooked } from '@/lib/waitlistService';
import { freeAppointmentSeat } from '@/lib/appointmentLifecycle';

let db: Db;
let weekday: string;
const hubId = oid();
const hub = String(hubId);
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const entry = (userId: unknown) => Waitlist.findOne({ userId }).lean<any>();
const offersTo = (userId: unknown) => db.collection('notifications').countDocuments({ userId, title: /A seat opened/ });
async function student(name: string) {
  const _id = oid();
  await db.collection('users').insertOne({ _id, email: `${name}@test.local`, firstName: name });
  return _id;
}

before(async () => {
  db = await resetDatabase();
  weekday = await upcomingWeekday();
  await db.collection('hubs').insertOne({ _id: hubId, name: 'Hub A', timezone: 'America/New_York' });
});
after(disconnect);

test('seats starting within 2 hours are not offered', async () => {
  const waiting = await student('soon');
  await Waitlist.create({ userId: waiting, hubId, hubName: 'Hub A', status: 'waiting' });
  const soon = DateTime.now().setZone('America/New_York').plus({ minutes: 30 });
  assert.equal(await promoteWaitlist(hub, 'Hub A', { date: soon.toISODate()!, time: soon.toFormat('h:mm a') }), null);
  assert.equal((await entry(waiting)).status, 'waiting');
  await Waitlist.deleteMany({});
});

test('offers go to the longest-waiting matching student, with date and time', async () => {
  const booked = await student('booked');
  const evening = await student('evening');
  const morning = await student('morning');
  await Appointment.create({ userId: booked, hubName: 'Hub A', appointmentDate: new Date(`${weekday}T00:00:00Z`), appointmentTime: '10:00 AM', status: 'confirmed', notes: '' });
  await Waitlist.collection.insertMany([
    { userId: booked, hubId, hubName: 'Hub A', status: 'waiting', createdAt: ago(400) },
    { userId: evening, hubId, hubName: 'Hub A', timePreference: 'Evening', status: 'waiting', createdAt: ago(300) },
    { userId: morning, hubId, hubName: 'Hub A', timePreference: 'Morning', status: 'waiting', createdAt: ago(200) },
  ]);

  const offered = await promoteWaitlist(hub, 'Hub A', { date: weekday, time: '9:00 AM' });
  assert.equal(String(offered?.userId), String(morning));
  assert.equal((await entry(booked)).status, 'booked', 'already-booked student is closed out');
  assert.equal((await entry(evening)).status, 'waiting', 'evening-only student skipped for a morning seat');
  const message = await db.collection('notifications').findOne({ userId: morning });
  assert.match(message!.message, /9:00 AM/);

  await promoteWaitlist(hub, 'Hub A', { date: weekday, time: '9:30 AM' });
  assert.equal(await offersTo(morning), 1, 'not re-offered within 24h');

  await Waitlist.updateOne({ userId: morning }, { $set: { notifiedAt: ago(25 * 60) } });
  await promoteWaitlist(hub, 'Hub A', { date: weekday, time: '10:00 AM' });
  assert.equal(await offersTo(morning), 2, 'eligible again once the offer expires');
  await Waitlist.deleteMany({});
});

test('concurrent releases notify a person only once', async () => {
  const solo = await student('solo');
  await Waitlist.create({ userId: solo, hubId, hubName: 'Hub A', status: 'waiting' });
  await Promise.all([1, 2, 3].map(() => promoteWaitlist(hub, 'Hub A', { date: weekday, time: '11:00 AM' })));
  assert.equal(await offersTo(solo), 1);
  await Waitlist.deleteMany({});
});

test('freeing a seat offers it; a seat that already started does not', async () => {
  const future = await student('future');
  await Waitlist.create({ userId: future, hubId, hubName: 'Hub A', status: 'waiting' });
  await freeAppointmentSeat({ hubId, hubName: 'Hub A', appointmentDate: new Date(`${weekday}T00:00:00Z`), appointmentTime: '9:00 AM' });
  assert.equal((await entry(future)).status, 'notified');
  await Waitlist.deleteMany({});

  const past = await student('past');
  await Waitlist.create({ userId: past, hubId, hubName: 'Hub A', status: 'waiting' });
  const today = DateTime.now().setZone('America/New_York').toISODate()!;
  await freeAppointmentSeat({ hubId, hubName: 'Hub A', appointmentDate: new Date(`${today}T00:00:00Z`), appointmentTime: '12:00 AM' });
  assert.equal((await entry(past)).status, 'waiting');

  await markWaitlistBooked(past);
  assert.equal((await entry(past)).status, 'booked');
});
