# Dralvo Landing

Dralvo is a dark, gold-focused SaaS MVP for XAUUSD technical analysis.

## Quick Start

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local development.
- `npm run build` - create production build.
- `npm run start` - serve production build.
- `npm run lint` - run ESLint.

## Environment

Create `.env.local` for Supabase-backed waitlist writes:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
TWELVE_DATA_API_KEY=
FRED_API_KEY=
```

Without Supabase env values, the waitlist API returns a clear configuration error instead of silently storing data in memory.
`CRON_SECRET` is required for `/api/ingest`; call it with `Authorization: Bearer <CRON_SECRET>` or `/api/ingest?secret=<CRON_SECRET>` for scheduled jobs.

## Project Structure

- `src/app` - Next.js routes, API handlers, and SEO files.
- `src/components` - shared UI, marketing, and dashboard components.
- `src/data` - structured MVP seed data.
- `src/lib` - utilities and server integrations.
- `docs` - product plan and architecture notes.
- `supabase` - MVP database schema.

## Product Docs

- [Project Plan](docs/PROJECT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)

## Legal

Dralvo is for informational purposes only and is not financial advice.
