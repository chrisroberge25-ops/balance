# Balance

Know where your time goes.

Balance is a life-balance tracker: calendar events become hours, hours are measured against Work, Life, Sleep, and Health goals, and a short daily check-in records how the day actually felt. It is the product version of a personal spreadsheet, not a copy of the grid.

## What you can do

- See today, the month, and the year against category goals.
- Add, edit, and delete time entries. A second subcategory is a label only — hours count once, on the primary key.
- Import an `.xlsx` Entry Log (the original workbook format) and export CSV or XLSX.
- Score motivation, sleep, work, life, and health from 1 to 10, and mark a yes/no habit list. Completion is yes answers divided by the habits you marked.
- Read a balance score, a category split, goal gaps, qualitative trends, and habit rates.
- Start on Free (200 entries a month) and upgrade to Pro with a Stripe stub. No card is charged.
- Connect Google Calendar when OAuth credentials exist. Without them, paste events or use the connection stub. The in-app Calendar page documents the env vars and scopes.

## The model

Default goals are **Work 30% / Life 30% / Sleep 30% / Health 10%**.

| Group | Keys |
| --- | --- |
| Work | Job `W:J`, Side Hustle `W:S`, Music `W:M`, Business `W:B`, Education `W:E` |
| Life | Family `L:F`, Social `L:S`, Personal `L:P`, Other `L:O`, Child `L:C` |
| Health | Mental `H:M`, Physical `H:P`, Eating `H:E`, Other `H:O`, Extra `X:X` |
| Sleep | Sleep `S:S`, Nap `S:N` |

Put a key in the event title (`L:S - dinner`). A second key (`L:F + H:P`) is stored as context and is not added to the totals.

Untracked time:

- A past day is `24 − tracked`.
- Today is `max(0, hours since midnight − tracked)`, rounded to the nearest 0.25.
- A future day is `0`.

February uses the real length of the month, including leap years. Totals are computed when you open the app, so there is no nightly spreadsheet job.

The demo workspace includes the sanitized 2025 Entry Log from the source workbook (notes stripped of links and phone numbers) plus two recent weeks of example days, scores, and habits. Rows without a key stay in the log and in the import error list. In that workbook, `L:S - chilling with Jacob` is the row that already carries a key.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Prisma (Postgres in production, SQLite locally), Recharts. UI is custom and uses the same patterns as a small shadcn-style kit (buttons, fields, cards) without a CLI install.

## Run it

```bash
npm install
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Demo account:

- Email: `demo@balance.app`
- Password: `balance-demo`

Development:

```bash
npm run dev
```

Tests for the untracked-time rules and the calendar-key parser:

```bash
npm test
```

## Environment

Copy `.env.example` to `.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Local SQLite file (`file:./dev.db`, created under `prisma/`) or a hosted Postgres URL. Production must be Postgres. |
| `DIRECT_URL` | Direct Postgres URL used by `prisma migrate deploy`. Optional when `DATABASE_URL_UNPOOLED` is set. |
| `DATABASE_URL_UNPOOLED` | Set by the Neon integration. Used as the migration URL when `DIRECT_URL` is empty. |
| `DATABASE_PROVIDER` | Optional. `sqlite` forces the local file database. `postgresql` forces Postgres. Ignored on Vercel, which always uses Postgres. |
| `NEXT_PUBLIC_APP_URL` | Public origin, used to build the Google redirect URI |
| `GOOGLE_CLIENT_ID` | OAuth client id. Blank keeps the stub |
| `GOOGLE_CLIENT_SECRET` | OAuth secret. Token exchange is still stubbed in this build |
| `GOOGLE_REDIRECT_URI` | Defaults to `{APP_URL}/api/calendar/google/callback` |
| `STRIPE_SECRET_KEY` | If set, the app tells you checkout is still simulated |
| `STRIPE_PRICE_PRO` | Reserved for a live price id |

Google scope: `https://www.googleapis.com/auth/calendar.readonly`.

`/api/calendar/google/start` builds the real Google consent URL when both client id and secret are present and the account is Pro. `/api/calendar/google/callback` stores a connected flag and does not call Google’s token endpoint.

`/api/billing/checkout` sets the plan to Pro and writes a `cus_stub_…` customer id.

## Deploy

Production runs on Vercel. A SQLite file (`file:./dev.db`) is created during the build and then disappears on the serverless filesystem, so `/login` returns 500. Production needs hosted Postgres.

`npm run build` generates the Prisma client, applies the schema (`prisma migrate deploy` for Postgres, `prisma db push` for local SQLite), seeds `demo@balance.app` / `balance-demo` when the database has no users, then builds Next.js. On Vercel that build fails fast if `DATABASE_URL` is still a `file:` URL and no Postgres URL is present.

### Vercel env

Set these on the `balance` project for Production, Preview, and Development, then redeploy:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled URL (`-pooler` host, `sslmode=require`). The integration sets this. |
| `DATABASE_URL_UNPOOLED` | Neon direct URL (no `-pooler`). The integration sets this. `DIRECT_URL` is the same string if you are not using Neon’s name. |
| `NEXT_PUBLIC_APP_URL` | `https://balance-woad-six.vercel.app` |

Leave `GOOGLE_*` and `STRIPE_*` unset. The app keeps its stubs.

The project already has `DATABASE_URL=file:./dev.db`. Delete that variable before connecting Neon. The integration does not overwrite an existing `DATABASE_URL`.

### Provision Neon (free)

Neon is the Vercel Marketplace Postgres. The team install can already exist; the database still has to be created and connected to this project.

1. Open the [balance project env vars](https://vercel.com/balance-3a55/balance/settings/environment-variables) and delete `DATABASE_URL` if its value is `file:./dev.db`.
2. Open [Neon in the Vercel Marketplace](https://vercel.com/marketplace/neon) and create a database on the **Free** plan, or from a linked checkout run:
   ```bash
   vercel integration add neon --name balance --plan free -e production -e preview -e development
   ```
3. Connect the resource to the `balance` project. Confirm `DATABASE_URL` and `DATABASE_URL_UNPOOLED` exist and are not `file:` URLs.
4. Set `NEXT_PUBLIC_APP_URL` to `https://balance-woad-six.vercel.app`.
5. Merge and redeploy. The build migrates `prisma/migrations` and seeds the demo user.

### Confirm login after deploy

```bash
curl -sI https://balance-woad-six.vercel.app/login
```

Expect `HTTP/2 200`. Open `/login`, submit `demo@balance.app` / `balance-demo`, and land on `/app`.

Local SQLite is unchanged: copy `.env.example` to `.env` and run `npm run dev`. To point a laptop at Postgres, set `DATABASE_URL` and `DIRECT_URL` (or `DATABASE_URL_UNPOOLED`) to Postgres URLs instead of `file:./dev.db`.

## Scripts

- `npm run dev` — apply the local schema, seed when empty, start the dev server
- `npm run build` — generate the client, migrate (Postgres) or push (SQLite), seed when empty, production build
- `npm start` — serve the production build
- `npm test` — parser, untracked-time, and database-url tests
- `npm run db:setup` — generate the client, apply the schema, and seed when empty
- `npm run db:seed` — seed again (no-op once a user exists)
