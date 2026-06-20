# Dralvo Architecture

## Runtime Shape

Dralvo uses a Next.js fullstack architecture:

- Frontend: Next.js App Router and Tailwind CSS.
- API: Next.js route handlers.
- Database: Supabase Postgres.
- Auth: Supabase Auth.
- Payments: Stripe Checkout, Billing Portal, and webhooks.
- Notifications: in-app records, SMTP email, and Telegram bot webhook.
- Data pipeline: scheduled source adapters write traceable evidence observations
  and compatibility snapshots into Supabase.

FastAPI is deferred until the data pipeline becomes complex enough to justify a separate service.

## Application Boundaries

- Marketing routes handle landing, pricing, legal pages, SEO, and signup CTAs.
- Auth routes handle signup, login, reset password, and Supabase callbacks.
- Dashboard routes require Supabase Auth and render Today thesis, Drivers,
  thesis monitors, replay, optional technical context, notifications, and
  billing state.
- API routes validate inputs and use server-only clients for Supabase, Stripe, SMTP, and Telegram.
- Supabase stores persistent data and enforces ownership through RLS where client access is allowed.
- Stripe webhooks synchronize subscription lifecycle state into Supabase.

## Environment Variables

Required in production:

```env
NEXT_PUBLIC_SITE_URL=https://www.dralvo.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
CRON_SECRET=
OPS_ALERT_EMAILS=
OPS_ALERT_TELEGRAM_CHAT_ID=
TWELVE_DATA_API_KEY=
FRED_API_KEY=
```

Server-only variables must never be exposed to client components:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_PASS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `CRON_SECRET`

## Data Model

Core tables:

- `profiles`: one row per authenticated user, including notification preferences and Telegram chat linkage.
- `waitlist_signups`: legacy/lead capture email records.
- `indicator_snapshots`: latest and historical indicator values.
- `evidence_observations`: source facts with driver, series, value, unit,
  source URL, observation time, retrieval time, quality, and metadata.
- `evidence_corrections`: append-only correction audit trail for source facts
- `product_events`: privacy-limited first-party usage events for paid validation
  that were revised after ingestion.
- `thesis_snapshots`: one persisted thesis payload per thesis date, including
  state, methodology version, and generation timestamp.
- `alerts`: user-owned alert rules.
- `alert_notifications`: in-app notification history.
- `alert_trigger_state`: dedupe and previous-observed-value state for alert evaluation.
- `subscriptions`: Stripe-backed subscription records.
- `vietqr_payment_requests`: manual Vietnam payment requests and review state.
- `ingestion_run_logs`: operational outcomes for ingestion, thesis generation,
  notifications, and other scheduled work.

Canonical SQL lives in `supabase/schema.sql`. Incremental SQL lives in the
`supabase/migration_*.sql` files.

## Intelligence Data Flow

1. A source adapter fetches an official or licensed source at its native
   cadence.
2. The adapter validates and parses source facts into evidence observations.
3. The ingestion route writes evidence and compatibility snapshots for legacy
   dashboard surfaces.
4. `gold-thesis.v1` evaluates price, TIPS, CFTC, COMEX, and GLD observations
   with deterministic thresholds; missing or stale drivers receive no inferred
   value.
5. `/api/ingest/thesis` persists the daily thesis and
   `/api/thesis/today` serves the latest explainable result to authenticated
   users.
6. Today, Drivers, Replay, and thesis monitors consume the same evidence and
   thesis contracts.

The current product direction and delivery milestones are defined in
[`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md). The thesis/dashboard surfaces described
above belong to the V1 SaaS product and are slated for archival under the V2
pivot — see the archived V1 plan in
[`archive/v1-saas/SYSTEM_IMPLEMENTATION_PLAN.md`](./archive/v1-saas/SYSTEM_IMPLEMENTATION_PLAN.md).

## Billing Flow

1. Authenticated user starts Stripe Checkout from `/pricing`.
2. Checkout uses subscription mode with `trial_period_days: 3`.
3. Stripe redirects to `/api/stripe/checkout/success?session_id=...`.
4. Success route verifies the Supabase user, retrieves the Checkout Session, and upserts `subscriptions`.
5. Stripe webhooks keep long-term state in sync:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Dashboard reads `subscriptions.status` and displays Free, Pro, Trialing, Canceled, or payment issue states.

## Alert And Notification Flow

1. Pro user creates thesis monitors or numeric evidence alert rules through
   `/api/alerts`.
2. Backend enforces Pro access before reading or mutating alert rules.
3. Scheduler calls `/api/alerts/evaluate`.
4. Evaluator loads active alerts, latest indicator snapshots for numeric
   thresholds, and the latest thesis snapshot for `thesis:*` monitors.
5. Conditions are evaluated, including cross-above/cross-below using the
   previous observed value stored in `alert_trigger_state.last_value`, plus
   `state_is` checks for thesis and driver states.
6. Triggered monitors create in-app notifications and optionally send email or
   Telegram messages based on `profiles.notification_prefs`.
7. Telegram connection uses a short-lived one-time code stored in `notification_prefs`.

## Cron And Scheduling

Current Vercel Hobby-compatible schedules are daily:

- `00:00 UTC`: `/api/ingest`
- `00:05 UTC`: `/api/alerts/evaluate`
- `00:10 UTC`: `/api/ingest/thesis`
- `00:20 UTC`: `/api/ops/source-alerts`

Both routes accept either:

- `Authorization: Bearer <CRON_SECRET>`

Query-string secrets and client-supplied cron headers are rejected so scheduler
credentials do not leak through URLs or become spoofable.

For real alerting cadence, move to Vercel Pro cron or an external scheduler.

`/api/ops/source-alerts` sends operational email and Telegram alerts when the
freshness report is delayed or failed. Email recipients come from
`OPS_ALERT_EMAILS` or `ADMIN_EMAILS`; Telegram uses
`OPS_ALERT_TELEGRAM_CHAT_ID`.

Before deploying the thesis route, apply
`supabase/migration_thesis_snapshots.sql` in the target Supabase project.
For correction auditing, apply `supabase/migration_evidence_corrections.sql`.

## Replay And Export

- `/api/thesis/replay?date=YYYY-MM-DD` is Pro-gated and rebuilds
  `gold-thesis.v1` using only evidence with `observed_at` on or before the
  cutoff and `released_at` or `retrieved_at` knowable by that cutoff.
- `/api/export/csv` is Pro-gated and exports the evidence ledger
  (`source_key`, `driver_key`, `series_key`, value, timestamps, quality, and
  source URL).

## Corrections

Source corrections are handled as forward fixes:

1. Record the previous and corrected numeric value in `evidence_corrections`.
2. Keep the original observation linked through `evidence_observation_id`.
3. Update or re-ingest the corrected observation only after the correction row
   exists.
4. Rebuild affected thesis snapshots if the corrected observation changes a
   published thesis.

Do not delete or silently overwrite source facts without an audit row.

## Security Notes

- Stripe webhook signature verification uses `STRIPE_WEBHOOK_SECRET`.
- Telegram webhook verifies `x-telegram-bot-api-secret-token` when `TELEGRAM_WEBHOOK_SECRET` is set.
- Custom alert APIs are Pro-gated server-side.
- Protected dashboard/API routes are guarded in `src/proxy.ts`.
- Legal disclaimer states Dralvo is informational only and not financial advice.
