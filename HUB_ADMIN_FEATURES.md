# Hub-Based Admin System

Hub-admins manage one learning center. Super-admins manage every site, district closures, and system policy.

## Roles

- **Super Admin** (`isSuperAdmin: true`): all hubs, generator, reminders, blackout dates, audit logs, and settings.
- **Hub Admin** (`isAdmin: true` + `assignedHub`): only their assigned site. They can run intake day, book or reschedule a student, send hub messages, and export reports for that site.
- **Student** (`user`): register, book, confirm after profile, reschedule, inbox, PDF, and calendar file.

## Live admin navigation

Shared by hub-admins and super-admins:

- Analytics — today at the site, 7-day fill, charts
- Users — scoped CRUD, book or reschedule for a student
- Appointments — today’s intake queue, check-in / no-show / completed, waitlist, roster print
- Schools — district schools that own hubs (super-admins create and edit)
- Hubs — hub-admins edit their site; super-admins create and manage all hubs
- Classes — course catalog students can select after school and hub (super-admins create and edit)
- Schedule — weekly day-off with a reason
- Capacity — slot capacity for the assigned hub
- Messages — hub-admins send templates to their students only
- Notifications — in-app admin notices
- Reports — summary + CSV (hub-scoped for hub-admins)

Super-admin only:

- Generator
- Reminders
- Blackout (district closures; booking also respects per-hub day-off)
- Audit Logs
- Settings (booking window, reminder hours, max active appointments, require-profile-before-confirm, program quotas)
- Maintenance (reset operational data, reseed analytics, archive/retention)

## How access is enforced

1. Login JWT includes `isAdmin`, `isSuperAdmin`, and `assignedHub`.
2. Admin APIs use `verifyAdminToken`, `isAdmin` / `isSuperAdmin`, and `resolveRequestedHub` / `canAccessHub` in `lib/adminPermissions.ts` and `lib/adminUserAccess.ts`.
3. Appointments often store `hubName` only; hub filters match `hubId` or `hubName`.
4. Students use `lib/studentAuth.ts`. Active booking statuses are `pending`, `pending_profile`, `confirmed`, and `arrived`.

## Student flows that staff should know

- Quick register books a Morning / Evening / Saturday slot as `pending_profile` until the profile is complete.
- Confirm, reschedule, history, inbox, PDF, and **Add to calendar** live on the student dashboard.
- Forgot password emails a reset link. Locally, if SMTP is not configured, the form shows a continue link.
- Full windows can join a waitlist. A cancellation or no-show emails the next student and writes an inbox message.
- Confirmation, reminder, intake, password-reset, and waitlist emails are Spanish-first and attach an `.ics` when there is a date/time.

## Create admins

```bash
npm run admin:create <email> <password> super
npm run admin:create <email> <password> false "Hub Name"
```

Convert an existing user in MongoDB:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { isSuperAdmin: true } });

const hub = db.hubs.findOne({ name: "Adult Education at Coney Island Avenue" });
db.users.updateOne({ email: "hub.admin@example.com" }, { $set: { isAdmin: true, assignedHub: hub._id } });
```
