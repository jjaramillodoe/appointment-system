import { resetDatabase, disconnect, oid, request } from '../helpers/db';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET as SETTINGS_GET, PUT as SETTINGS_PUT } from '@/app/api/admin/reminders/settings/route';
import { POST as SEND_REMINDERS } from '@/app/api/admin/reminders/send/route';
import { GET as ADMIN_USERS } from '@/app/api/admin/users/route';
import { POST as BOOK_QUICK } from '@/app/api/appointments/book-quick/route';
import { GET as SEED_CLEAN } from '@/app/api/seed/clean/route';
import { GET as FIX_ADMIN } from '@/app/api/debug/fix-admin/route';

const hubAdmin = oid(), superAdmin = oid(), student = oid();

before(async () => {
  const db = await resetDatabase();
  await db.collection('users').insertMany([
    { _id: hubAdmin, email: 'hub@test.local', isAdmin: true, assignedHub: oid() },
    { _id: superAdmin, email: 'super@test.local', isAdmin: true, isSuperAdmin: true },
    { _id: student, email: 'student@test.local', isAdmin: false },
  ]);
});
after(disconnect);

test('reminder settings: all admins read, only super admins change or send', async () => {
  const body = { isEnabled: false, reminders: [] };
  assert.equal((await SETTINGS_GET(request('/x', { userId: hubAdmin }))).status, 200);
  assert.equal((await SETTINGS_PUT(request('/x', { method: 'PUT', userId: hubAdmin, body }))).status, 403);
  assert.equal((await SETTINGS_PUT(request('/x', { method: 'PUT', userId: superAdmin, body }))).status, 200);
  assert.equal((await SEND_REMINDERS(request('/x', { method: 'POST', userId: hubAdmin }))).status, 403);
});

test('admin APIs reject students and forged tokens', async () => {
  assert.equal((await ADMIN_USERS(request('/api/admin/users', { userId: student })))?.status, 403);
  const forged = request('/api/admin/users');
  forged.headers.set('authorization', 'Bearer forged');
  assert.equal((await ADMIN_USERS(forged))?.status, 403);
});

test('booking requires the student token', async () => {
  assert.equal((await BOOK_QUICK(request('/api/appointments/book-quick', { method: 'POST', body: {} }))).status, 401);
});

test('seed and debug routes are hidden outside development', async () => {
  assert.notEqual(process.env.NODE_ENV, 'development');
  assert.equal((await SEED_CLEAN(request('/api/seed/clean'))).status, 404);
  assert.equal((await FIX_ADMIN(request('/api/debug/fix-admin?email=x@test.local'))).status, 404);
});
