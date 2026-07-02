# Dralvo System Implementation Plan

> ⚠️ **TRẠNG THÁI (2026-07-01): doc này mô tả sản phẩm V1** (thesis monitors, alert delivery, "Pro plan", multi-driver). **Sản phẩm hiện tại là V2 và đã khác:** Free + **VIP** (bỏ Pro), lõi là **EA** (license per-EA + anti-share `license_devices`/`max_accounts`), thông báo = chuông + hộp thư + thông báo hệ thống (alert rules đã gỡ), affiliate có rút tiền. Nguồn sự thật: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) · [`HANDOFF.md`](./HANDOFF.md). Nội dung dưới giữ làm tham chiếu lịch sử.

Date: 2026-06-13
Status: V1 (historical)
Product source of truth: [`PRODUCT_TRUTH_AND_STRATEGY.md`](./PRODUCT_TRUTH_AND_STRATEGY.md)

## Objective

Build Dralvo into a gold decision-intelligence product that turns verified
positioning, inventory, fund-flow, macro, and price evidence into an
explainable market thesis and monitors when that thesis changes.

The system is complete for a production-grade Pro launch only when:

- every production driver uses a named public or licensed source;
- every displayed conclusion can be traced to observations and methodology;
- the Today view explains support, contradiction, stale data, and change;
- users can inspect driver history and create multi-driver monitors;
- paid-enabled validation has shown retention and willingness to pay;
- simulated financial observations are absent from production paths.

## Product Assumptions

- Initial audience: intermediate XAUUSD users across Vietnamese, English, and
  Brazilian Portuguese.
- Initial access: Free plus paid Pro remain available. The product may be sold
  during validation, but Pro claims and gated features must only describe real,
  implemented data capabilities.
- Initial payment rails: Stripe globally and VietQR/manual bank transfer for
  Vietnam.
- Initial data budget: low-cost real data and real tooling first; paid sources
  are acceptable when they unlock CFTC, COMEX, ETF, TIPS, or XAUUSD value with
  usable licensing.
- Dralvo complements TradingView and MetaTrader instead of replacing them.
- Technical indicators remain optional context, not paid differentiation.

## Implementation Status

As of 2026-06-13:

- M0 guardrails are implemented in production paths and marketing copy:
  unavailable data stays unavailable, illustrative previews are labelled, and
  simulated financial values are not used as fallbacks.
- M1 is implemented for CFTC Gold COMEX positioning, FRED DFII10 real yields,
  and Twelve Data XAUUSD price context.
- M2 has an initial production dataset: CME registered/eligible gold inventory
  and official SPDR GLD holdings are implemented alongside source-health
  checks. Evidence corrections are applied through an atomic, append-only audit
  workflow. CFTC annual archive backfill is implemented from official
  Disaggregated Futures Only ZIP files, one year per bounded request. GLD and
  FRED TIPS yearly backfills are also live. XAUUSD has a one-request-per-year
  backfill path. Historical depth for COMEX inventory remains open.
- M3 has its first working slice: deterministic `gold-thesis.v2`, authenticated
  Today API/UI, evidence trail, change conditions, and daily stored thesis
  snapshots. What-changed history and driver methodology pages are implemented.
  Version 2 adds an explicit, non-predictive price-versus-fundamental
  relationship: confirming, diverging, neutral, or insufficient data. The
  relationship is available in Today, Replay, and the What Changed timeline.
  Pro thesis monitors can target the relationship directly and reuse the
  existing deduplicated in-app, email, and Telegram delivery pipeline.
- M4 has its first working slice: thesis monitors reuse the alert delivery
  pipeline, and historical replay excludes evidence not knowable by the replay
  cutoff. Replay depth still depends on retained evidence and source release
  metadata.
- M5-M6 remain active delivery work.
- Source-health ops alerts and correction audit storage are implemented; broader
  production validation and paid cohort review remain open.
- The production Supabase migration is applied and all required tables pass the
  protected health check.
- Production ingestion has been verified end to end for CFTC, CME COMEX XLS,
  SPDR GLD, FRED TIPS, and Twelve Data XAUUSD evidence. `gold-thesis.v2`
  currently builds with 5/5 required drivers and exposes the explicit
  price-versus-fundamental relationship without turning it into a forecast.
- Health monitoring is cadence-aware. Production currently reports delayed
  source freshness rather than a pipeline failure when weekly/daily official
  publications are inside their configured delay windows.
- Production readiness is green for Stripe, SePay/VietQR, Supabase schema, and
  core application environment. SePay dynamic QR generation, webhook
  confirmation, idempotent database activation, and a daily API reconciliation
  fallback are implemented. A real incoming-transfer test and dashboard webhook
  configuration still need founder-side SePay access.
- The n8n host health endpoint returns HTTP 200, but its public API still
  returns HTTP 500 even though an API key is configured in the local connector,
  so the five-minute alert workflow still requires account-level recovery and
  verification on the n8n host. A GitHub Actions `Production Scheduler`
  fallback is implemented to call `/api/alerts/evaluate` every five minutes
  once repository secret `DRALVO_CRON_SECRET` is configured.
- Privacy-conscious first-party product analytics are implemented for dashboard
  route usage, monitor creation, Stripe/VietQR checkout intent, and evidence
  export. The admin-only 70-day summary reports weekly active users, returning
  users, conversion-event users, top dashboard routes, and closed-window
  week-4/week-8 cohort retention without storing IP addresses, query strings,
  email addresses, or free-form user content.
- Multilingual coverage now includes the landing page, pricing page, auth
  flows, legal pages, notification templates, dashboard navigation, Today
  thesis, What Changed, Drivers, Replay, page headers, monitors, settings, and
  user menu. Remaining localization work is deeper driver-methodology registry
  prose and any future provider-specific error text.
- Primary dashboard navigation is thesis-led (`Today`, `Drivers`, `Monitors`,
  `Replay`, `Settings`). The chart remains available as supporting price
  context but is no longer positioned as a top-level product destination.
- The Drivers workspace now exposes real CFTC Managed Money history and a
  window percentile from stored evidence. Production retains 74 direct weekly
  observations from 2025-01-07 through 2026-06-02 with archive provenance
  verified across the year boundary. Free receives the latest 12 weekly
  observations; Pro receives an extended retained window.
- A bounded, idempotent GLD archive backfill is implemented one calendar year
  per request. The Drivers workspace supports issuer-backed GLD tonnes history,
  a daily change view, and a window percentile without labelling holdings
  changes as capital flow. Production retains 361 direct daily holdings points
  from 2025-01-02 through 2026-06-11.
- A bounded FRED DFII10 backfill is implemented one calendar year per request.
  TIPS history preserves missing publication days, derives changes only from
  consecutive valid observations, and is available in the Drivers workspace.
  Production retains 360 direct yield observations from 2025-01-02 through
  2026-06-10.
- A bounded XAUUSD backfill uses one Twelve Data request per calendar year with
  up to 5,000 daily bars. It does not add scheduled provider calls and derives
  daily change only from consecutive real closes. Production retains 491
  direct daily closes from 2025-01-01 through 2026-06-12 after exactly two
  one-time provider requests.
- Official CME research confirms that the current COMEX Gold Stocks XLS is
  public, while historical Registrar data is routed through CME DataMine.
  Dralvo therefore retains the official daily report going forward and does
  not use third-party mirrors or fabricate pre-retention history. Purchasing a
  DataMine history is a data-budget decision, not a hidden implementation gap.
- CME COMEX ingestion now uses browser-compatible download headers and the
  official Registrar page as referer. Production ingestion recovered from the
  prior CME 403 and again writes all five required thesis drivers.

## Target Architecture

```text
Official/licensed sources
        |
        v
Source adapters ---- validation/quarantine
        |
        v
Evidence observations (immutable, sourced, timestamped)
        |
        v
Driver calculations (versioned, deterministic, explainable)
        |
        v
Thesis snapshots (supportive / mixed / adverse / insufficient)
        |
        +-------------------+
        |                   |
        v                   v
Today + Drivers         Monitor evaluator
                            |
                            v
                 In-app / email / Telegram
```

### Runtime Boundaries

- Next.js remains the application and API runtime during the beta.
- Supabase Postgres remains the system of record.
- Scheduled route handlers fetch source data at source cadence.
- Product UI must be multilingual from the start: Vietnamese (`vi`), English
  (`en`), and Brazilian Portuguese (`pt-BR`).
- A separate worker service is deferred until ingestion duration, backfills,
  retries, or source volume exceed serverless limits.
- Existing alerts and notifications now support thesis monitors.

### Internationalization

- Default locale: Vietnamese.
- Required launch locales: Vietnamese, English, Brazilian Portuguese.
- User-facing product taxonomy, thesis states, CTA text, legal disclaimers, and
  billing copy must come from shared locale dictionaries.
- Numeric values, source names, timestamps, and methodology IDs remain canonical
  and are formatted per locale at the presentation layer.
- Data pipelines do not duplicate by locale; interpretation copy localizes after
  driver states are calculated.
- Landing, pricing, auth, dashboard, settings, legal, email, and Telegram
  templates must all use the same locale registry before production launch.

## Data Contracts

### Evidence Observation

An evidence observation is a source fact, not an interpretation. It contains:

- `source_key` and canonical `source_url`;
- `driver_key` and `series_key`;
- numeric value and unit;
- source observation date;
- release timestamp when the source provides it;
- retrieval timestamp;
- quality state;
- source-specific metadata.

Observations are upserted only to make ingestion idempotent. Corrections must
retain an audit trail once correction handling is introduced.

### Driver State

A driver state is a versioned calculation over evidence:

- current value and change;
- historical percentile or z-score where defensible;
- relevant horizon;
- relationship to XAUUSD;
- interpretation state;
- methodology version;
- freshness and missing-data state.

### Thesis Snapshot

A thesis snapshot records:

- state: `supportive`, `mixed`, `adverse`, or `insufficient_data`;
- supporting and contradicting driver states;
- stale and missing drivers;
- rules and methodology version;
- conditions that would materially change the thesis.

It is not a buy/sell signal.

## Delivery Milestones

### M0: Product Truth And Beta Guardrails

- Keep paid infrastructure but stop presenting commodity indicators as the
  paid product.
- Keep Free and paid Pro CTAs while limiting claims to implemented capability.
- Mark demo or estimated data clearly.
- Prohibit simulated financial data in production ingestion.

Exit: marketing claims match implemented capabilities.

### M1: Verified Evidence Foundation

- CFTC Gold COMEX disaggregated futures-only positioning.
- TIPS real-yield observations without fallback fabrication.
- XAUUSD price/history without fabricated changes.
- Evidence schema, provenance, freshness, and ingestion tests.
- Driver/source registry with cadence, required series, source URL, and
  methodology version.

Exit: source facts are queryable and traceable in Supabase.

### M2: Differentiated Gold Dataset

- COMEX registered and eligible inventory.
- Validated official GLD holdings series, labelled as holdings rather than
  inferred fund flow.
- Historical backfill and correction workflow.
- Source health and stale-data monitoring.

Exit: macro, positioning, inventory, flow, and price are available together.

### M3: Intelligence Loop

- Deterministic driver calculations.
- First Today thesis with evidence trail.
- What-changed timeline.
- Methodology pages and source limitations.

Exit: a user can understand the current thesis without opening each source.

### M4: Recurring Workflow

- Drivers workspace.
- Multi-driver thesis monitors.
- In-app, email, and Telegram explanations.
- Historical replay without look-ahead bias.

Exit: users receive useful updates when evidence or thesis conditions change.

### M5: Paid-Enabled Market Validation

- Early paid Pro users and targeted trial cohorts.
- Concierge briefing where useful, but not as a replacement for checkout.
- Product analytics for weekly return behavior.
- Interviews based on real usage.
- Four- and eight-week retention review.
- Pricing and willingness-to-pay test.

Measurement foundation implemented:

- authenticated first-party event ingestion with an explicit event allowlist;
- one dashboard route view per browser session and route;
- server-confirmed monitor, checkout, VietQR request, and export events;
- admin-only 70-day WAU, returning-user, funnel, route, and closed-window
  week-4/week-8 cohort summary;
- cohort start defined as each user's first observed product event, with week 4
  measured on days 28-34 and week 8 measured on days 56-62;
- users are excluded from a retention denominator until the complete
  measurement window has elapsed.

The cohort, interview, four-week, and eight-week outcomes still require real
elapsed user behavior and cannot be inferred from implementation.

Exit: differentiated usage and payment intent justify one Pro plan.

### M6: Production Launch

- Landing, pricing, legal, auth, and dashboard aligned across Vietnamese,
  English, and Brazilian Portuguese.
- Stripe and VietQR payment paths verified for Pro activation.
- Vietnamese, English, and Brazilian Portuguese UI/copy coverage verified.
- Operational runbooks, source alerts, retries, and correction handling.
- Accessibility, performance, responsive, security, and data-rights review.
- One Free and one Pro package.

Exit: evidence quality, user value, and operations support scaling paid Pro.

## Execution Order

1. Completed: CFTC current ingestion and evidence storage.
2. Completed: initial CFTC historical backfill route.
3. Completed: remove fabricated TIPS and XAUUSD changes/fallbacks.
4. Completed: COMEX inventory source validation and adapter.
5. Completed: official GLD holdings source validation and adapter.
6. Completed: first deterministic driver-state and thesis framework.
7. Completed: Today thesis API, UI, persistence, and daily generation route.
8. Completed: what-changed timeline, methodology pages, Drivers, thesis
   monitors, and historical replay.
9. Completed: public landing/pricing truth alignment, one primary navigation
   CTA, public multilingual methodology route, source limitations, and
   truthful VietQR configuration state.
10. Completed: deterministic price-versus-fundamental divergence detection in
    `gold-thesis.v2`, shared by Today, Replay, stored snapshots, and timeline
    change detection, plus a Pro monitor target for confirming or diverging
    relationship states.
11. In progress: final localization coverage and remaining payment/scheduler
   production validation. SePay/VietQR code, env, migration, readiness, and
   fallback reconciliation are implemented; the remaining payment validation is
   a real SePay dashboard webhook delivery and real bank-transfer activation.
   Scheduler fallback code is implemented; remaining verification is enabling
   the GitHub repository secret and confirming a scheduled run.
12. In progress: paid-enabled market validation measurement, including
    closed-window week-4/week-8 retention, is live; cohort recruitment and
    elapsed retention evidence remain pending.
13. Pending: production launch hardening and launch
    review.

## Reliability Rules

- A source failure never becomes a plausible-looking fallback value.
- Stale data remains visible with its original observation date.
- Parsing failures are logged and do not overwrite the latest valid evidence.
- Each adapter has fixture-based parser tests.
- Every derived result stores its methodology version.
- Schedules follow source cadence rather than arbitrary polling frequency.
- Source changes trigger an operational alert before they affect users.

## Cost And Scale

Beta assumptions:

- fewer than 1,000 users;
- fewer than 20 core series;
- daily or weekly specialist-source updates;
- hourly price context where free-tier limits permit.

At this scale, Supabase and scheduled Next.js handlers are sufficient. Revisit
queues and dedicated workers when backfills exceed route duration, source
adapters need browser automation, or ingestion volume creates contention.

## Decisions Requiring Founder Approval

- Acceptable monthly data budget after low-cost public/source prototypes.
- Exact first beta cohort and briefing channel.
- Final terminology for thesis states and driver names in Vietnamese, English,
  and Brazilian Portuguese.
