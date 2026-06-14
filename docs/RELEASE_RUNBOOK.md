# Dralvo Release Runbook

## Pre-Release Checks

Run these locally before production deploy:

```bash
npm run test
npm run lint
npm run audit:encoding
npm run audit:secrets
npm run audit:vulnerabilities
npm run build
```

Recommended public-funnel checks after UI or theme changes:

- Mobile Lighthouse on `/`, `/pricing`, and `/methodology` should report 100
  accessibility, best practices, and SEO.
- Mobile Lighthouse on `/login`, `/signup`, and `/reset-password` should report
  100 accessibility and best practices. SEO is intentionally reduced because
  auth routes are `noindex`.
- Password recovery should be checked in both modes:
  `/reset-password` for requesting a link and `/reset-password?update=true` for
  invalid or expired recovery links. A real Supabase recovery email should land
  on the update form and allow setting a new password.
- Pro checkout intent should survive auth:
  visiting `/api/stripe/checkout?intent=pro` while signed out should redirect to
  `/login?redirect=%2Fapi%2Fstripe%2Fcheckout%3Fintent%3Dpro`, and the pricing
  Pro CTA should send signed-out users to signup with the same internal
  checkout redirect.
- Checkout return UI should be visible:
  `/pricing?checkout=cancelled` and `/pricing?checkout=error` show localized
  pricing notices; `/dashboard?checkout=success`,
  `/dashboard?checkout=sync_failed`, and `/dashboard?checkout=missing_session`
  show localized dashboard status banners for authenticated users.
- Protected-route auth redirects should preserve the full internal destination:
  a signed-out request to `/dashboard?checkout=success` should redirect to
  `/login?redirect=%2Fdashboard%3Fcheckout%3Dsuccess`.
- Landing LCP should remain comfortably below 2.5 seconds in lab checks; the
  latest local trace measured 109 ms on an unthrottled production build.

Required production smoke checks:

```bash
# Health
curl -H "Authorization: Bearer $CRON_SECRET" https://www.dralvo.com/api/health

# Alert evaluator
curl -H "Authorization: Bearer $CRON_SECRET" https://www.dralvo.com/api/alerts/evaluate

# Source-health ops alert
curl -H "Authorization: Bearer $CRON_SECRET" https://www.dralvo.com/api/ops/source-alerts

# SePay reconciliation fallback
curl -H "Authorization: Bearer $CRON_SECRET" https://www.dralvo.com/api/sepay/reconcile
```

## Deploy

```bash
vercel --prod --yes
```

Confirm Vercel aliases the deployment to:

```text
https://www.dralvo.com
```

## Post-Deploy Verification

- `/api/health` returns `ok: true` and `readiness.ready: true`.
- `/api/health.schema.required_tables` has no failed table.
- `/api/health` reports `readiness.sepay_schema_ready: true`.
- `/api/health` reports `vietqr_ready: true` before Vietnam checkout launch.
- `data.freshness.overall` is not `failed`.
- `/api/alerts/evaluate` returns `ok: true`.
- `/api/ingest/thesis` returns `ok: true` when called by cron auth.
- `/api/ops/source-alerts` returns `ok: true`; when freshness is delayed or
  failed, it records `source_health_alert` and sends configured ops channels.
- An authenticated admin request to `/api/ops/product-analytics` returns a
  70-day summary with `retention.week4` and `retention.week8`.
- Dashboard `/dashboard/settings` loads Billing, Notification Preferences,
  Operational Run Logs, and the admin-only Product Validation panel.
- Stripe webhook endpoint returns 2xx for new successful delivery events.
- SePay sends an incoming-transfer test to
  `https://www.dralvo.com/api/sepay/webhook`; the delivery returns `200`, the
  matching payment becomes confirmed, and the account receives 30 days of Pro.
- Replaying the same SePay transaction returns `200` without extending Pro a
  second time.
- `/api/sepay/reconcile` returns `ok: true`; it should usually report zero
  matches unless there is a pending VietQR request whose webhook delivery was
  missed.
- Stripe checkout `GET /api/stripe/checkout?intent=pro` redirects an
  authenticated Free user to Stripe Checkout and redirects signed-out users to
  login with an internal checkout continuation.
- n8n workflow `Dralvo Alert Evaluation Cron` is active and calls `/api/alerts/evaluate` every 5 minutes.
- The n8n Authorization header uses the same current `CRON_SECRET` as Vercel;
  rotate both sides together.
- If n8n is unavailable, GitHub Actions `Production Scheduler` must be enabled
  with repository secret `DRALVO_CRON_SECRET`; it calls
  `/api/alerts/evaluate` every five minutes and low-frequency jobs only at
  fixed UTC minutes.
- Vercel cron calls `/api/sepay/reconcile` daily as a low-frequency fallback;
  real-time Pro activation should still come from the SePay webhook.

## Product Validation Analytics

- Retention cohorts start at each user's first observed product event.
- Week 4 retention checks for a return during days 28-34. A user becomes
  eligible only after day 35.
- Week 8 retention checks for a return during days 56-62. A user becomes
  eligible only after day 63.
- A `null` rate means no cohort has completed the relevant window; it is not a
  zero-percent retention result.
- If `potentially_truncated` is `true`, the query reached the 50,000-event cap.
  Treat cohort rates as incomplete until analytics storage or pagination is
  expanded.
- The endpoint is intentionally admin-only. A signed-out request should return
  `401`, and an authenticated non-admin request should return `403`.

## Rollback

1. Open Vercel project deployments.
2. Promote the previous known-good production deployment.
3. Re-run health and alert evaluator smoke checks.
4. If Stripe webhook failures occurred during the bad deploy, replay failed Stripe events after rollback.
5. If Supabase migrations caused the issue, avoid destructive rollback. Add a forward fix migration instead.

## Source Corrections

When a provider revises a published value:

1. Confirm the revised value at the official source URL.
2. An admin calls `POST /api/ops/evidence-corrections` with the observation id,
   corrected numeric value, reason, and official revision URL.
3. The database RPC locks the observation, appends the correction audit row,
   and updates the evidence value in one transaction. Correction rows reject
   updates and deletes at the database layer.
4. Re-run `/api/ingest/thesis` with cron auth.
5. Review `/api/thesis/history` and dashboard What Changed for the affected
   date before announcing the correction to users.

## CFTC Historical Backfill

Backfill one official CFTC Disaggregated Futures Only archive year per request:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.dralvo.com/api/ingest/cftc/backfill?year=2025"
```

- Supported years start at 2009.
- The route downloads `fut_disagg_txt_<year>.zip`, selects Gold COMEX contract
  `088691`, and upserts in batches of 250 observations.
- The operation is idempotent on source, series, and observation date.
- Annual archives only store direct report observations; the current-report
  adapter's derived prior-week baseline is intentionally excluded to avoid
  overwriting an adjacent year's official observation provenance.
- Annual archives contain report dates but not exact publication timestamps.
  These rows improve driver history, but Replay remains conservative and does
  not pretend the values were knowable before Dralvo retrieved them.

## GLD Historical Backfill

Backfill one calendar year from the official SPDR Gold Shares archive per
request:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.dralvo.com/api/ingest/gld/backfill?year=2026"
```

- Supported years start at 2004, the GLD launch year.
- The route downloads the official issuer workbook once, selects the requested
  year, and upserts in batches of 250 observations.
- Stored series include tonnes, total ounces, total NAV, and the holdings
  change derived from consecutive issuer observations.
- The operation is idempotent on source, series, and observation date.
- The archive contains observation dates but not exact publication timestamps.
  It improves Drivers research while Replay continues to use retrieval time as
  the conservative availability boundary.

## TIPS Historical Backfill

Backfill one calendar year of FRED DFII10 observations per request:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.dralvo.com/api/ingest/tips/backfill?year=2026"
```

- Supported years start at 2003.
- The FRED request includes December of the prior year so the first valid
  observation can have a defensible consecutive change.
- Missing FRED values (`.`) are discarded rather than estimated.
- Stored series are the official yield percent and a derived basis-point
  change between consecutive valid observations.
- Exact historical publication timestamps are not supplied by this endpoint,
  so Replay continues to use retrieval time conservatively.

## XAUUSD Historical Backfill

Backfill one calendar year with one Twelve Data provider request:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.dralvo.com/api/ingest/xauusd/backfill?year=2026"
```

- The request uses daily bars, a bounded date range, and `outputsize=5000`.
- It consumes one time-series provider request per year and is not scheduled.
- Stored series are the daily close and the percentage change from the prior
  valid close.
- Run years sequentially to stay inside the shared Twelve Data limiter.
- Historical bars lack an exact provider publication timestamp, so Replay uses
  retrieval time as the conservative availability boundary.

## Security Notes

- Rotate any API key pasted into chat, screenshots, or external tools.
- Keep `.env.local` untracked.
- Keep `ADMIN_EMAILS` restricted to actual operators.
- Do not run `npm audit fix --force` without checking Next.js compatibility.
