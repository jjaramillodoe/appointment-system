import { resetDatabase, disconnect, oid, request } from '../helpers/db';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Db } from 'mongodb';
import Appointment from '@/models/Appointment';
import { PUT } from '@/app/api/admin/appointments/route';
import { GET as ROSTER } from '@/app/api/admin/appointments/roster/route';
import { hubCalendarToday } from '@/lib/slotDateTime';

let db: Db;
const admin = oid();
const student = oid();
let early: any;
let late: any;
const today = hubCalendarToday();

before(async () => {
  db = await resetDatabase();
  const day = new Date(`${today}T00:00:00.000Z`);
  await db.collection('users').insertMany([
    { _id: admin, email: 'admin@test.local', isAdmin: true, isSuperAdmin: true },
    { _id: student, email: 'student@test.local', firstName: 'María', lastName: 'Peña', profileCompleted: true },
  ]);
  await db.collection('hubs').insertOne({ name: 'Test Hub', timezone: 'America/New_York' });
  await db.collection('appointmentslots').insertMany([
    { hubName: 'Test Hub', date: day, time: '9:00 AM', capacity: 5, bookedCount: 2 },
    { hubName: 'Test Hub', date: day, time: '10:00 AM', capacity: 5, bookedCount: 1 },
  ]);
  late = await Appointment.create({ userId: student, hubName: 'Test Hub', appointmentDate: day, appointmentTime: '10:00 AM', status: 'confirmed', notes: '' });
  early = await Appointment.create({ userId: student, hubName: 'Test Hub', appointmentDate: day, appointmentTime: '9:00 AM', status: 'confirmed', notes: '' });
});
after(disconnect);

const setStatus = (status: string) =>
  PUT(request('/api/admin/appointments', { method: 'PUT', userId: admin, body: { appointmentIds: [String(early._id)], status } }));
const seats = async () => (await db.collection('appointmentslots').findOne({ time: '9:00 AM' }))!.bookedCount;
const current = async () => (await Appointment.findById(early._id).lean())!;

test('unknown statuses are rejected and nothing changes', async () => {
  assert.equal((await setStatus('bogus')).status, 400);
  assert.equal((await current()).status, 'confirmed');
});

test('check-in, done, and undo keep the original check-in time', async () => {
  await setStatus('arrived');
  const checkedIn = (await current()).checkedInAt;
  assert.ok(checkedIn);
  assert.equal(await seats(), 2);

  await setStatus('completed');
  assert.ok((await current()).completedAt);
  assert.equal(+(await current()).checkedInAt!, +checkedIn!);

  await setStatus('arrived');
  assert.equal((await current()).completedAt, undefined);
  assert.equal(+(await current()).checkedInAt!, +checkedIn!);
});

test('no-show frees exactly one seat and notifies once; undo retakes it', async () => {
  const notices = () => db.collection('notifications').countDocuments({ type: 'no_show' });
  await setStatus('no_show');
  assert.equal(await seats(), 1);
  assert.equal(await notices(), 1);

  await setStatus('no_show');
  assert.equal(await seats(), 1, 'repeat no-show must not free a second seat');
  assert.equal(await notices(), 1);

  await setStatus('arrived');
  assert.equal(await seats(), 2);
});

test('roster is in clock order with hub-local start times', async () => {
  const res = await ROSTER(request(`/api/admin/appointments/roster?date=${today}`, { userId: admin }));
  const { appointments } = await res.json();
  assert.deepEqual(appointments.map((row: any) => row.time), ['9:00 AM', '10:00 AM']);
  const lateRow = appointments.find((row: any) => row._id === String(late._id));
  assert.match(lateRow.startsAt, /T10:00:00\.000-0[45]:00$/);
});
