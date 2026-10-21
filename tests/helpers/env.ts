/**
 * Must be the first import of every integration test: lib/mongodb reads MONGODB_URI at import.
 * Refuses anything but a local throwaway database so tests can never touch Atlas/production.
 */
const uri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/appointment-system-test';
const { hostname, pathname } = new URL(uri);
if (!['127.0.0.1', 'localhost', 'mongo'].includes(hostname) || !/test/i.test(pathname)) {
  throw new Error(`Refusing to run tests against ${hostname}${pathname}: use a local database whose name contains "test"`);
}

// Test files run in parallel processes: give each its own database
const perProcess = new URL(uri);
perProcess.pathname = `${pathname.replace(/\/$/, '')}-${process.pid}`;
process.env.MONGODB_URI = perProcess.toString();
process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_ENABLED = 'false';
// No SMTP: emails are skipped, in-app notifications are still written
delete process.env.SMTP_HOST;

export {};
