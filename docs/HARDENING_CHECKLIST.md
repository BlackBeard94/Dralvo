# Dralvo Production Hardening Checklist

> ⚠️ **TRẠNG THÁI (2026-07-01):** phần hạ tầng/bảo mật chung vẫn dùng được, nhưng các mục nhắc **"Pro alert rules / thesis / `/api/alerts/evaluate` / n8n 5-phút"** là **V1 đã gỡ** — bỏ qua. Sản phẩm hiện tại: Free + **VIP**, lõi là **EA** (license per-EA + anti-share `license_devices`/`max_accounts`), affiliate có rút tiền. Nguồn sự thật: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) · [`HANDOFF.md`](./HANDOFF.md).

## Current Status

- [x] Production deploy on `https://www.dralvo.com`
- [x] Supabase Auth, Stripe Checkout, Billing Portal, and webhook sync
- [x] Pro alert rules with in-app, email, and Telegram notification paths
- [ ] Recover n8n external cron and verify `/api/alerts/evaluate` every 5 minutes
- [x] Supabase notification migration applied
- [x] Loading and error boundaries for app and dashboard routes
- [x] Simulated financial fallback values removed from production paths
- [x] Dashboard mobile viewport uses dynamic viewport height
- [x] `.env.local` OIDC token and duplicate empty SMTP value removed

## Phase 3 Hardening Work

- [x] Add unit tests for billing access status helpers
- [x] Add unit tests for alert condition evaluation
- [x] Add API integration tests for Free/Pro alert gating
- [x] Add API integration tests for Stripe webhook lifecycle events
- [x] Add notification dispatch tests with mocked email/Telegram/Supabase clients
- [x] Add rate limiting to public and auth-sensitive endpoints
- [x] Add protected health endpoint for data and environment status
- [x] Persist ingest, alert evaluation, and Stripe webhook run logs
- [x] Replace simulated sparkline data with stored snapshot history and source-series fallback labels
- [x] Add Pro CSV export for the evidence ledger
- [x] Add append-only evidence correction audit table
- [x] Add source-health ops alert route and cron
- [x] Require bearer `CRON_SECRET`; reject spoofed `x-vercel-cron` headers
- [x] Apply production evidence/thesis/VietQR Supabase migration
- [x] Parse and ingest the official CME legacy XLS/BIFF8 COMEX report
- [x] Verify production thesis generation with all 5 required drivers
- [x] Add allowlisted first-party product analytics and admin-only summaries
- [x] Complete local mobile Lighthouse accessibility hardening for landing,
      pricing, methodology, login, signup, and reset-password
- [x] Complete password recovery update flow after Supabase recovery callback
- [x] Preserve Pro checkout intent through pricing, signup, login, email
      verification, and authenticated Stripe checkout continuation
- [x] Align legal copy with paid Pro by removing MVP/as-is language and adding
      billing, trial, cancellation, tax/refund, and availability terms
- [ ] Configure and validate production VietQR credentials
- [ ] Synchronize the rotated `CRON_SECRET` with n8n after service recovery
- [ ] Rotate leaked n8n API keys and consider rotating Telegram bot token

## Operational Checks

- Protected health check: `GET /api/health` with `Authorization: Bearer <CRON_SECRET>`.
- Alert evaluation check: `GET /api/alerts/evaluate` with the same bearer token.
- Rate limits are in-memory per runtime instance, intended as abuse protection for the current release. Move to Redis or Supabase-backed counters before high-volume launch.
- Run logs require the `public.run_logs` migration in `supabase/migration_run_logs.sql` to be applied in Supabase.

## Operational Notes

- Vercel Hobby cron stays daily so deploys do not fail.
- n8n is intended to own the 5-minute alert evaluation cadence, but its
  host health endpoint returns HTTP 200 while its public API returns HTTP 500.
  The workflow is not verified operational and no local operator API key is
  available.
- `CRON_SECRET` must match between Vercel and n8n before re-enabling the
  workflow.
- Do not run `npm audit fix --force` without reviewing Next.js compatibility.
