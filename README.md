# NYC DOE District 79 Adult Education Appointment System

A web application for NYC Public Schools District 79 Adult Education intake: adult learners register and book an intake appointment at a learning center, and staff manage schedules, check students in, and report on intake across hubs.

## 🏛️ Project Information

- **Organization**: NYC Department of Education (DOE), District 79 – Adult Education
- **Stack**: Next.js 16 (App Router), React 19, TypeScript 6, MongoDB (Mongoose 9), Tailwind CSS
- **Hosting**: Vercel (production and preview deployments)
- **Main developer**: Javier Jaramillo, Data Systems Administrator

## 🎯 Features

**Students**
- Quick registration (account + appointment in two steps), then complete the profile to confirm the booking
- English and Spanish UI (other languages via a clearly labeled Google Translate fallback)
- Dashboard: appointment details, reschedule/cancel, waitlist, notifications inbox, printable PDF, calendar (.ics) download
- Automatic email reminders before appointments

**Staff**
- **Today** front-desk view: search, check-in, done, no-show (with undo), late flags, printable roster
- Appointment table with search, filters, bulk actions, and CSV export
- Hubs, schools, classes, schedules, capacity, blackout dates, communications, reports, analytics
- Hub admins see only their hub; super admins see everything and manage system settings
- Audit log of admin actions (including exports)

## 🚀 Getting Started

### Prerequisites

- Node.js 22
- MongoDB 7 for local development and tests (`brew install mongodb-community` on macOS, or Docker `mongo:7`)
- Optional: Redis (availability caching and rate limiting; the app works without it)

### Local development

```bash
npm ci
cp env.production.example .env.local   # then edit the values below
npm run dev                            # http://localhost:3000
```

Admin dashboard: http://localhost:3000/admin/dashboard

> ⚠️ Point `.env.local` at a **local** database for development. Seed routes (`/api/seed/*`) and debug routes only work in development and are disabled (404) everywhere else.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes (production) | Signs login tokens. The app refuses to run in production without it |
| `NEXT_PUBLIC_APP_URL` | production | Public base URL used in email links (defaults to `http://localhost:3000`) |
| `CRON_SECRET` | production | Authorizes Vercel Cron calls to `/api/cron/*` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | for email | Outgoing email (confirmations, password resets, reminders, waitlist offers). Without `SMTP_HOST`, no email is sent and reminders are skipped |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | optional | Maps on the student dashboard |
| `REDIS_URL`, `REDIS_ENABLED` | optional | Redis cache/rate limiting (`REDIS_ENABLED=false` to turn off) |
| `BREVO_API_KEY` | optional | Brevo SMS (development-only endpoint at present) |
| `LOG_LEVEL`, `NEXT_PUBLIC_LOG_LEVEL` | optional | Logging verbosity |

## 🧪 Quality checks

```bash
npm run lint          # ESLint (Next.js core-web-vitals + TypeScript rules)
npm run typecheck     # tsc --noEmit
npm run test:unit     # no database needed
npm run test:integration
npm test              # unit + integration
```

Integration tests call the real route handlers against a **throwaway local MongoDB**. Each test process uses its own database and drops it afterwards. The suite refuses to run unless the database host is local and its name contains `test`, so it can never touch Atlas:

```bash
mongod --dbpath /tmp/mongo-test --port 27099   # in another terminal
TEST_MONGODB_URI=mongodb://127.0.0.1:27099/appointment-system-test npm run test:integration
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, type-check, unit and integration tests (with a MongoDB service container), and a production build on every pull request.

> TypeScript is pinned to 6.0 because `typescript-eslint` does not support TypeScript 7 yet. Move back to 7 once it does.

> The old Mongoose-migration scripts in `tests/mongoose-*.test.ts` write to whatever `MONGODB_URI` points at and are no longer wired to npm scripts. Don't run them against a real database.

## 🌐 Translations

UI text lives in `lib/i18n/dictionaries/`. `en.ts` is the source; `es.ts` must have the same keys, which is enforced by TypeScript and by `tests/unit/i18n.test.ts`. Use `useI18n()` in client components:

```tsx
const { t, locale } = useI18n();
return <h1>{t.registerPage.title}</h1>;
```

The active language comes from the `locale` cookie, falling back to the browser's `Accept-Language`. Stored values (statuses, profile options) stay in English, and only their labels are translated. **The Spanish text is a draft and should be reviewed by DOE translation staff.**

## ⏰ Scheduled jobs (Vercel Cron, see `vercel.json`)

| Path | Schedule | What it does |
| --- | --- | --- |
| `/api/cron/expire-appointments` | daily 04:15 UTC | Marks past, unattended appointments expired |
| `/api/cron/send-reminders` | hourly | Sends due reminder emails (default: 24h before) |

Both require `Authorization: Bearer $CRON_SECRET`, which Vercel adds automatically.

## 🚀 Deployment

Vercel deploys `main` to production and every pull request to a preview. Set the environment variables above in the Vercel project (`vercel env add …`). Manual deploys: `npm run deploy:vercel` (preview) / `npm run deploy:vercel:prod`.

### Database scripts

- `npm run db:backup`: `mongodump` of the **local** database into `database-backups/` (git-ignored)
- `npm run db:restore`: ⚠️ restores `database-backups/latest` into `$MONGODB_URI` **with `--drop`**, replacing existing data
- `npm run migrate:quick` / `migrate:to-production` / `migrate:verify`: one-time local → production migration helpers

> The **Create backup** button in Admin → Settings is a placeholder and does not back anything up. Use MongoDB Atlas backups/snapshots for production.

## 📁 Project structure

```
app/                Next.js routes (pages and app/api route handlers)
  admin/dashboard/  Staff dashboard (today, appointments, users, hubs, …)
  dashboard/        Student dashboard
  api/              REST endpoints (admin/*, appointments/*, auth/*, cron/*, …)
components/         React components (admin/, dashboard/, home/, ui/)
contexts/           Auth, hub filter, and i18n providers
lib/                Domain logic: booking lifecycle, reminders, waitlist, permissions, i18n, …
models/             Mongoose models
tests/              unit/ and integration/ suites (node:test via tsx)
scripts/            Admin/migration scripts
```

## 🔒 Security notes

- Admin permissions are re-checked against the database on every request; demoted or deleted admins lose access immediately.
- Login, registration, and password-reset endpoints are rate limited.
- Exports and admin actions are written to the audit log. CSV exports neutralize spreadsheet formulas.
- Never commit data exports. Root-level `*.csv` and `*.xlsx` files are git-ignored because they may contain student information.

## 📄 License

Developed for NYC DOE District 79 Adult Education programs. All rights reserved.
