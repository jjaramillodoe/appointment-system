import { resetDatabase, disconnect, oid, request } from '../helpers/db';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Db } from 'mongodb';
import Appointment from '@/models/Appointment';
import { GET as LIST, PUT, DELETE } from '@/app/api/admin/appointments/route';
import { GET as EXPORT } from '@/app/api/admin/appointments/export/route';

let db: Db;
const hubA = oid(), superAdmin = oid(), hubAdmin = oid(), maria = oid(), smith = oid();
let a1: any, a2: any, a3: any;

before(async () => {
  db = await resetDatabase();
  const day = new Date('2026-10-21T00:00:00.000Z');
  await db.collection('hubs').insertMany([{ _id: hubA, name: 'Hub A', timezone: 'America/New_York' }, { name: 'Hub B', timezone: 'America/New_York' }]);
  await db.collection('users').insertMany([
    { _id: superAdmin, email: 'super@test.local', isAdmin: true, isSuperAdmin: true },
    { _id: hubAdmin, email: 'huba@test.local', isAdmin: true, assignedHub: hubA },
    { _id: maria, email: 'maria@test.local', firstName: 'María', lastName: 'Peña', phone: '2125551234' },
    { _id: smith, email: 'smith@test.local', firstName: '=HYPERLINK("http://x","click")', lastName: 'Smith, "Jr"', phone: '7185550000' },
  ]);
  await db.collection('appointmentslots').insertOne({ hubName: 'Hub A', date: day, time: '9:00 AM', capacity: 5, bookedCount: 3 });
  a1 = await Appointment.create({ userId: maria, hubName: 'Hub A', hubId: hubA, appointmentDate: day, appointmentTime: '9:00 AM', status: 'confirmed', notes: '', adminNotes: 'Needs interpreter' });
  a2 = await Appointment.create({ userId: smith, hubName: 'Hub B', appointmentDate: day, appointmentTime: '9:00 AM', status: 'confirmed', notes: '' });
  a3 = await Appointment.create({ userId: maria, hubName: 'Hub A', hubId: hubA, appointmentDate: day, appointmentTime: '9:00 AM', status: 'cancelled', notes: '' });
});
after(disconnect);

const list = async (userId: typeof superAdmin, qs = '') => (await LIST(request(`/api/admin/appointments?${qs}`, { userId }))).json();
const ids = (data: any) => data.appointments.map((row: any) => String(row._id)).sort();

test('search matches student first name, full name, and phone', async () => {
  assert.deepEqual(ids(await list(superAdmin, 'search=mar')), [String(a1._id), String(a3._id)].sort());
  assert.equal(ids(await list(superAdmin, `search=${encodeURIComponent('María Peña')}`)).length, 2);
  assert.deepEqual(ids(await list(superAdmin, 'search=555-0000')), [String(a2._id)]);
});

test('regex characters in search are safe; limit is capped', async () => {
  assert.equal((await LIST(request('/api/admin/appointments?search=(((%5B', { userId: superAdmin }))).status, 200);
  assert.equal((await list(superAdmin, 'limit=100000')).pagination.limit, 100);
});

test('hub admins only see their own hub', async () => {
  const seen = ids(await list(hubAdmin));
  assert.ok(seen.includes(String(a1._id)));
  assert.ok(!seen.includes(String(a2._id)));
});

test('CSV export: filtered, escaped, formula-safe, audited, hub-scoped', async () => {
  const res = await EXPORT(request('/api/admin/appointments/export?search=smith', { userId: superAdmin }));
  assert.match(res.headers.get('content-type')!, /^text\/csv/);
  const bytes = new Uint8Array(await res.clone().arrayBuffer());
  assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xef, 0xbb, 0xbf], 'UTF-8 BOM for Excel');
  const csv = await res.text();
  assert.equal(csv.trim().split('\r\n').length, 2);
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x"",""click"")"`));
  assert.ok(csv.includes(`"Smith, ""Jr"""`));
  assert.equal(await db.collection('auditlogs').countDocuments({ action: 'export' }), 1);

  const hubCsv = await (await EXPORT(request('/api/admin/appointments/export', { userId: hubAdmin }))).text();
  assert.ok(hubCsv.includes('Hub A') && !hubCsv.includes('Hub B'));
});

test('bulk status change without notes keeps existing admin notes', async () => {
  await PUT(request('/api/admin/appointments', { method: 'PUT', userId: superAdmin, body: { appointmentIds: [String(a1._id)], status: 'arrived' } }));
  assert.equal((await Appointment.findById(a1._id).lean())!.adminNotes, 'Needs interpreter');
});

test('bulk delete frees seats only for seat-holding appointments', async () => {
  await DELETE(request('/api/admin/appointments', { method: 'DELETE', userId: superAdmin, body: { appointmentIds: [String(a1._id), String(a3._id)] } }));
  assert.equal((await db.collection('appointmentslots').findOne({ hubName: 'Hub A' }))!.bookedCount, 2);
  assert.equal(await Appointment.countDocuments({ _id: { $in: [a1._id, a3._id] } }), 0);
});
