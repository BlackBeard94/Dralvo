# Deployment Checklist - Dralvo Production

## Pre-Deploy Verification

- [ ] `npm run audit:encoding` passes.
- [ ] `npm run lint` passes with 0 warnings.
- [ ] `npm run build` passes.
- [ ] `npm run audit:vulnerabilities` confirms no high or critical issues.
- [ ] No secrets are committed or printed in docs.
- [ ] Supabase migrations have been applied.

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://www.dralvo.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase service role key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_PRO_PRICE_ID` | Yes | Recurring Pro price |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for `/api/stripe/webhook` |
| `VIETQR_BANK_BIN` | Vietnam payments | Recipient bank BIN/acquirer ID |
| `VIETQR_BANK_CODE` | Vietnam payments | SePay bank code, for example `ACB` |
| `VIETQR_ACCOUNT_NO` | Vietnam payments | Recipient bank account number |
| `VIETQR_ACCOUNT_NAME` | Vietnam payments | Recipient account name |
| `VIETQR_PRO_PRICE_VND` | Vietnam payments | Pro transfer amount in VND |
| `VIETQR_TEMPLATE` | Vietnam payments | SePay QR template, for example `compact` |
| `SEPAY_API_TOKEN` | Vietnam payments | Server-only SePay API token for reconciliation tooling |
| `SEPAY_WEBHOOK_API_KEY` | Vietnam payments | Secret required in the SePay webhook Authorization header |
| `SMTP_HOST` | Yes | Example: `mail.privateemail.com` |
| `SMTP_PORT` | Yes | Example: `465` |
| `SMTP_USER` | Yes | SMTP mailbox username |
| `SMTP_PASS` | Yes | SMTP mailbox password |
| `SMTP_FROM` | Yes | Example: `Dralvo <contact@dralvo.com>` |
| `TELEGRAM_BOT_TOKEN` | Yes for Telegram | Bot token from BotFather |
| `TELEGRAM_BOT_USERNAME` | Yes for Telegram | Bot username without `@` |
| `TELEGRAM_WEBHOOK_SECRET` | Yes for Telegram | Random secret for Telegram webhook header |
| `CRON_SECRET` | Yes | Random string for scheduler calls |
| `ADMIN_EMAILS` | Admin operations | Comma-separated operator accounts allowed to confirm VietQR payments |
| `OPS_ALERT_EMAILS` | Ops alerts | Comma-separated operator emails. Falls back to `ADMIN_EMAILS` if empty |
| `OPS_ALERT_TELEGRAM_CHAT_ID` | Ops alerts | Telegram chat id for source-health alerts |
| `TWELVE_DATA_API_KEY` | Data pipeline | Twelve Data key |
| `FRED_API_KEY` | Data pipeline | FRED key |

## Supabase Setup

1. Run `supabase/schema.sql` for fresh projects.
2. Preferred existing-project path:

```powershell
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

The primary migrations are stored in
`supabase/migrations/20260612153000_gold_decision_intelligence.sql` and
`supabase/migrations/20260613170000_sepay_vietqr_webhook.sql`.

3. If applying legacy migrations manually, run:
   - `supabase/migration_subscriptions.sql`
   - `supabase/migration_notifications.sql`
   - `supabase/migration_run_logs.sql`
   - `supabase/migration_evidence_observations.sql`
   - `supabase/migration_thesis_snapshots.sql`
   - `supabase/migration_evidence_corrections.sql`
   - `supabase/migration_vietqr_payments.sql`
4. Confirm these objects exist:
   - `subscriptions.plan_tier`
   - `profiles.notification_prefs`
   - `profiles.telegram_chat_id`
   - `alert_notifications`
   - `alert_trigger_state`
   - `evidence_observations`
   - `thesis_snapshots`
   - `evidence_corrections`
   - `product_events`
   - `run_logs`
   - `vietqr_payment_requests`
5. Configure Auth redirect URLs:
   - `https://www.dralvo.com/auth/callback`
   - `http://localhost:3000/auth/callback`
6. Configure SMTP for Supabase Auth email.

## Stripe Setup

Use one active webhook endpoint:

```text
https://www.dralvo.com/api/stripe/webhook
```

Listen to:

```text
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
```

Pro Checkout must include a real 3-day trial. Verify in Stripe Checkout that the first invoice reflects the trial period before billing.

## VietQR Setup

Use SePay's dynamic VietQR and incoming-transfer webhook alongside Stripe.

1. Connect the receiving bank account in SePay.
2. Set `VIETQR_BANK_BIN`, `VIETQR_BANK_CODE`, `VIETQR_ACCOUNT_NO`,
   `VIETQR_ACCOUNT_NAME`, `VIETQR_PRO_PRICE_VND`, `VIETQR_TEMPLATE`,
   `SEPAY_API_TOKEN`, and `SEPAY_WEBHOOK_API_KEY`.
3. Configure an incoming-transfer webhook at:

```text
https://www.dralvo.com/api/sepay/webhook
```

Use API-key authentication and set the same secret as
`SEPAY_WEBHOOK_API_KEY`. Filter transfer content by the `DRALVO` prefix when
SePay offers that option.
4. Keep `ADMIN_EMAILS` set to the operator accounts allowed to confirm manual
   transfers.
5. Test `/api/vietqr/payment-request` while signed in. The pricing page should
   poll the reference and switch to confirmed automatically after the webhook.
6. Test the fallback reconciler with cron auth:

```powershell
Invoke-RestMethod https://www.dralvo.com/api/sepay/reconcile `
  -Headers @{ Authorization = "Bearer <CRON_SECRET>" }
```

It should return `ok: true`. A normal idle result has `matched: 0`.
7. If webhook and API reconciliation are unavailable, confirm the reference
   manually:

```powershell
Invoke-RestMethod -Method Post https://www.dralvo.com/api/vietqr/confirm `
  -ContentType 'application/json' `
  -Body '{"reference":"DRALVO260612ABCDEF"}'
```

The admin must be signed in in the same browser/session used to call the
endpoint. Automatic and manual confirmation both activate Pro for 30 days.

## Telegram Setup

Run:

```powershell
npm run telegram:webhook
```

Verify Telegram reports:

```text
Webhook set: https://www.dralvo.com/api/telegram/webhook
Pending updates: 0
```

## Vercel Deploy

```powershell
vercel --prod --yes
```

Vercel Hobby only allows daily cron schedules. Current `vercel.json` is Hobby-compatible. For 5-minute alert evaluation, upgrade to Vercel Pro or use an external scheduler.

## GitHub Actions Scheduler Fallback

The repository includes `.github/workflows/production-scheduler.yml` as a
replacement for the n8n five-minute evaluator while n8n API recovery is open.

Configure these GitHub repository settings:

- Repository variable `DRALVO_SITE_URL`: `https://www.dralvo.com`
- Repository secret `DRALVO_CRON_SECRET`: same value as Vercel `CRON_SECRET`

The workflow runs every five minutes. It calls `/api/alerts/evaluate` every
run, and only calls the lower-frequency routes at specific UTC minutes. The
ingest route still applies provider cadence and Twelve Data limiting before it
fetches anything:

- minute `00`: `/api/ingest`
- minute `10`: `/api/ingest/thesis`
- minute `15`: `/api/sepay/reconcile`
- minute `20`: `/api/ops/source-alerts`

This keeps Twelve Data and SePay usage low while restoring sub-hourly alert
evaluation without depending on n8n.

## Post-Deploy Verification

- [ ] Landing page loads at `https://www.dralvo.com`.
- [ ] Pricing page shows Free and Pro with 3-day trial.
- [ ] Signup/login work on production.
- [ ] Email confirmation redirects to dashboard.
- [ ] `/dashboard` redirects unauthenticated users to login.
- [ ] Stripe Checkout redirects to `https://www.dralvo.com/dashboard?checkout=success`.
- [ ] Stripe webhook deliveries return `200 OK`.
- [ ] VietQR payment panel creates a QR when Vietnam payment env vars are set.
- [ ] SePay webhook confirms the VietQR reference and the user becomes Pro.
- [ ] SePay reconciliation fallback returns `ok: true` with cron auth.
- [ ] A repeated SePay transaction ID is handled idempotently.
- [ ] Admin fallback confirmation grants 30 days of Pro.
- [ ] Dashboard user menu shows Free, Pro, Trialing, or Canceled correctly.
- [ ] Billing portal opens from dashboard for Pro users.
- [ ] Free users cannot create alert rules through UI or API.
- [ ] Pro users can create alert rules.
- [ ] Telegram connect code links the account and expires after 10 minutes.
- [ ] Email, Telegram, and in-app notifications dispatch when alerts trigger.
- [ ] `/api/ingest` returns `401` without auth and `200` with `Authorization: Bearer <CRON_SECRET>`.
- [ ] `/api/alerts/evaluate` returns `401` without auth and `200` with `Authorization: Bearer <CRON_SECRET>`.
- [ ] `/api/ops/source-alerts` returns `401` without auth and `200` with `Authorization: Bearer <CRON_SECRET>`.
- [ ] `/api/health` reports `readiness.ready: true`, `schema_ready: true`,
      `sepay_schema_ready: true`, and `vietqr_ready: true`.
- [ ] GitHub Actions `Production Scheduler` is enabled, has
      `DRALVO_CRON_SECRET`, and its latest run succeeds.
- [ ] `/privacy`, `/terms`, and `/disclaimer` render.
- [ ] `/sitemap.xml`, `/robots.txt`, and `/manifest.webmanifest` render.
