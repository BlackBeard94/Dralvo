# Dralvo MVP Architecture

## Runtime Shape

Dralvo MVP uses a Next.js fullstack architecture:

- Frontend: Next.js App Router and Tailwind CSS.
- API: Next.js route handlers.
- Database: Supabase Postgres.
- Auth: Supabase Auth in a later MVP phase.
- Payments: Stripe in a later MVP phase.
- Data pipeline: scheduled jobs in a later phase, initially represented by mock seed data.

FastAPI is intentionally deferred until the data pipeline has enough complexity to justify a separate Python service.

## Application Boundaries

- Marketing routes handle landing, legal pages, SEO, and waitlist capture.
- Dashboard routes show product UI and indicator data.
- API routes validate inputs and talk to Supabase through server-side clients.
- Supabase stores persistent data and enforces uniqueness and ownership rules.

## Environment Variables

Required for Supabase-backed waitlist writes:

```env
NEXT_PUBLIC_SITE_URL=https://dralvo.com
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
TWELVE_DATA_API_KEY=
FRED_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Do not expose it to client components.
`CRON_SECRET` must stay server-only and is required to call `/api/ingest`.

## Data Model

Core tables:

- `profiles`: one row per authenticated user.
- `waitlist_signups`: normalized waitlist emails.
- `indicator_snapshots`: latest and historical indicator values.
- `alerts`: user-owned alert rules.
- `subscriptions`: Stripe-ready subscription records.

The canonical SQL lives in `supabase/schema.sql`.

## Data Pipeline Plan

Phase 1 uses `src/data/indicators.ts` as structured seed data. Phase 2 replaces this with scheduled ingestion into `indicator_snapshots`, while preserving the dashboard-facing shape.

## Security Notes

- Waitlist email is normalized before persistence.
- Duplicate waitlist emails are handled by a database unique constraint.
- Legal disclaimer states Dralvo is informational only and not financial advice.
- Service role access is limited to route handlers.
