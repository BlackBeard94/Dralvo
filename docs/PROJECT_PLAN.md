# Dralvo SaaS Product Plan

> ⚠️ **TRẠNG THÁI (2026-07-01): doc này mô tả sản phẩm V1** (SaaS phân tích — "Pro" tier, alert rules / thesis monitors, indicators làm lõi). **Sản phẩm hiện tại là V2 và đã khác:**
> - Gói chỉ còn **Free + VIP** (bỏ "Pro"; nhãn hiển thị "VIP", tier nội bộ `Unlimited`).
> - **Alert rules / thesis monitors đã gỡ** — `/dashboard/alerts` redirect `/dashboard`; thông báo giờ = chuông + hộp thư + thông báo hệ thống + ticker.
> - Lõi sản phẩm = **EA** (goldmaster/goldscalp/tigold), license **per-EA** + chống share (`license_devices` + `max_accounts`).
> - **Affiliate** có đăng ký + dashboard + **rút tiền** (VN bank / USDT, chi trả thủ công).
> - Nguồn sự thật hiện hành: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) · [`HANDOFF.md`](./HANDOFF.md) · [`KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md). Nội dung dưới giữ làm tham chiếu lịch sử.

> Product direction is defined in
> [`PRODUCT_TRUTH_AND_STRATEGY.md`](./PRODUCT_TRUTH_AND_STRATEGY.md). The
> technical platform below exists, but paid positioning must wait for validated
> gold-specific data pipelines and recurring user value.

## Current Platform Direction

Dralvo has a working SaaS platform for XAUUSD research. The intended product is
a gold-specific intelligence layer, not a generic technical-analysis dashboard.
During product validation:

- Current technical indicators are supporting/demo functionality.
- Free and Pro remain available so the product can be sold and tested with real
  users.
- Pro positioning must be constrained to capabilities backed by real data. CFTC,
  COMEX, ETF, TIPS, and XAUUSD pipelines are the gating work for stronger paid
  claims.
- The first production experience must support Vietnamese, English, and
  Brazilian Portuguese.
- Premium/Enterprise remain out of scope.

This plan intentionally excludes external channel operations and keeps execution centered on the Dralvo SaaS product.

## Live MVP Scope

Implemented and active:

- Next.js App Router fullstack app.
- Supabase Auth with email confirmation and protected dashboard access.
- Production domain: `https://www.dralvo.com`.
- Landing, pricing, signup, login, reset password, dashboard, and legal routes.
- Free/Pro product structure with Stripe Checkout, Billing Portal, subscription
  sync, webhooks, and VietQR manual-transfer support for Vietnam.
- Real 3-day Pro trial through Stripe Checkout.
- Thesis-first dashboard with Today thesis, What Changed timeline, XAUUSD
  chart, optional technical context, plan gating, and billing state.
- Verified evidence ingestion for XAUUSD, FRED 10-year TIPS real yields, CFTC
  Gold COMEX positioning, CME gold inventory, and official SPDR GLD holdings.
- Source registry, freshness health, ingestion run logs, and fixture-based
  parser tests.
- Deterministic `gold-thesis.v1` with Today API/UI, evidence traceability,
  missing/stale handling, explicit change conditions, and daily persistence.
- Driver workspace with methodology, source cadence, decision question, and
  limitations for each implemented driver.
- Thesis monitors, evidence-threshold rules, in-app notifications, email
  notifications, Telegram notifications, and notification preferences for Pro
  users.
- Historical thesis replay endpoint/UI with a no-look-ahead availability rule.
- Pro CSV export of the evidence ledger, not demo indicator snapshots.
- Source-health ops alert route for delayed or failed evidence freshness.
- Supabase schema and migrations for profiles, evidence, thesis snapshots,
  indicator snapshots, alerts, subscriptions, notifications, run logs, thesis
  snapshots, and
  VietQR payments.
- Multilingual coverage for Vietnamese, English, and Brazilian Portuguese on
  landing, pricing, auth, legal, notification templates, and the main thesis
  dashboard surfaces.
- Encoding audit guard to prevent mojibake regressions.

## Pricing

- Stripe infrastructure is implemented.
- VietQR infrastructure is implemented for Vietnam market payment requests.
- Pricing and trial configuration are technical capability, not validated
  willingness to pay.
- Keep one paid Pro plan while differentiated data and retention are being
  validated.
- Do not sell the current RSI/MACD/SMA dashboard as the paid product.

## Operational Reality

- Vercel Hobby cron is limited to daily schedules.
- Current Vercel cron schedules:
  - `/api/ingest`: daily.
  - `/api/alerts/evaluate`: daily.
- For 5-minute alert evaluation, use one of:
  - Vercel Pro cron.
  - External cron provider calling `/api/alerts/evaluate` with `Authorization: Bearer <CRON_SECRET>`.
- The alert evaluator endpoint is healthy in production, but the current n8n
  service/API returns HTTP 500. Treat five-minute scheduling as unavailable
  until n8n is recovered and its `CRON_SECRET` is synchronized with Vercel.
- Protected production health currently has core environment and schema ready.
  Full readiness is false only because VietQR production credentials are not
  configured.

## Current Success Criteria

- `npm run lint` passes.
- `npm run build` passes.
- `npm run audit:encoding` passes.
- Signup/login work on `https://www.dralvo.com`.
- Stripe Checkout creates a Pro subscription with a 3-day trial.
- Stripe webhooks return `200 OK` and sync subscription lifecycle state.
- Dashboard user menu displays Free, Pro, Trialing, Canceled, or payment issue states.
- Pro users can create alert rules.
- Free users cannot create alert rules through UI or API.
- Alert evaluation can be called by Vercel Cron or an authorized external scheduler.
- Telegram connect uses a short-lived one-time code.
- Email and Telegram notification env vars are configured in Vercel.
- Legal routes exist for privacy, terms, and disclaimer.
- Locale registry covers Vietnamese, English, and Brazilian Portuguese for
  shared product copy.
- Sitemap excludes protected dashboard routes.

## Next Priorities

Detailed architecture, milestones, exit criteria, and implementation order now
live in [`SYSTEM_IMPLEMENTATION_PLAN.md`](./SYSTEM_IMPLEMENTATION_PLAN.md).

1. Localize deeper driver-methodology registry prose and provider-specific error
   text where it appears in user-facing views.
2. Configure VietQR production bank/API credentials and validate Pro activation.
3. Recover n8n, synchronize `CRON_SECRET`, and verify the five-minute workflow.
4. Validate Stripe Pro activation in a real production checkout.
5. Validate recurring value through paid-enabled user testing and concierge
   briefings where useful.

## Out of Scope For Current MVP

- FastAPI backend.
- AI trading assistant.
- Trade execution.
- Financial advice or automated buy/sell signals.
- Premium/Enterprise workflows.
- Content calendar or YouTube operations.
