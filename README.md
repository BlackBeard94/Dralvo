# Dralvo

Dralvo is a gold-trader ecosystem for XAUUSD: a backtested trading strategy
delivered through MT5 indicators/EA, a Telegram hub, and a web app for
content, signal distribution, licensing, and billing.

> **Product direction (V2):** Indicator → Bot EA → Course → IB commission →
> Copy trade. The single source of truth is
> [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md). Dralvo previously shipped a V1
> SaaS analytics dashboard; that direction is archived under
> [`docs/archive/v1-saas/`](docs/archive/v1-saas/) and most of its code still
> lives in this repo pending the V2 migration (see the FILE MAP in the plan).

This repository (`dralvo-landing`) is the Next.js web app. MT5 / TradingView /
Telegram artifacts will live in sibling folders as the V2 pivot proceeds.

## Quick Start

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start local development.
- `npm run build` — create production build.
- `npm run start` — serve production build.
- `npm run lint` — run ESLint (0 warnings allowed).
- `npm run test` — run Vitest.
- `npm run audit:encoding` — check for mojibake patterns.
- `npm run audit:secrets` — check for committed secrets.
- `npm run audit:vulnerabilities` — fail on high/critical npm advisories.
- `npm run telegram:webhook` — set the Telegram bot webhook.

## Environment

Copy [`.env.example`](.env.example) to `.env.local` and fill in the values.
`.env.example` is the canonical list of required variables — keep it in sync
with the code rather than duplicating the list here. Server-only secrets must
never be exposed to client components.

```powershell
cp .env.example .env.local
```

## Architecture & Stack

Next.js App Router + Supabase (Auth + Postgres) + Stripe / VietQR (billing) +
SMTP/Telegram (notifications). The data pipeline ingests CFTC, COMEX, GLD, TIPS,
and XAUUSD evidence — this pipeline is the moat carried over from V1 and powers
the V2 strategy backtests.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the runtime shape.

## Project Structure

- `src/app` — Next.js pages, route handlers, SEO files.
- `src/components` — shared UI, marketing, and dashboard components.
- `src/data` — indicator seed data and ingestion fetchers.
- `src/lib` — server integrations and utilities.
- `scripts` — backtest engine, MT5 EA source, ingestion/ops scripts.
- `supabase` — canonical schema and migrations.
- `docs` — see [`docs/README.md`](docs/README.md) for the documentation map.

## Documentation

Start at [`docs/README.md`](docs/README.md). Key entry points:

- [Product Plan (V2, canonical)](docs/PRODUCT_PLAN.md)
- [Strategy System](docs/DRALVO_STRATEGY_SYSTEM.md)
- [Indicator Spec](docs/DRALVO_INDICATOR_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)

## Legal

Dralvo is for informational purposes only and is not financial advice. Past
backtest performance does not guarantee future results.
