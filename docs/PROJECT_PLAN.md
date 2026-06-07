# Dralvo SaaS MVP Plan

## Product Focus

Dralvo is a SaaS platform for XAUUSD traders who need gold-specific market context in one focused dashboard. This plan intentionally excludes the 30-day content plan for the "Trade Vang AI" channel and keeps execution centered on the Dralvo product.

## MVP Goal

Ship a production-ready MVP with:

- A polished landing page and waitlist.
- Supabase-backed email capture.
- Auth-ready application structure.
- A dashboard shell for XAUUSD with six indicator cards.
- Legal pages and financial disclaimer.
- English-first copy with a structure that can support Vietnamese later.

## MVP Scope

### Phase 1: Foundation

- Next.js App Router, Tailwind CSS, and Dralvo brutalist-luxury visual identity.
- Landing page with working CTA, legal links, dashboard preview, and waitlist form.
- Supabase schema for profiles, waitlist, indicator snapshots, alerts, and subscriptions.
- Static dashboard route using structured mock indicator data.
- SEO essentials: metadata, robots, sitemap, manifest, favicon/icon, Open Graph image route.
- Project docs, README, lint/build scripts, and archive cleanup.

### Phase 2: Data Pipeline

- Replace mock data with scheduled ingestion for:
  - SGE Premium
  - COT Swap Dealer
  - COMEX Inventory
  - ETF Flows
  - TIPS Yields
  - Gold-BTC Correlation
- Add freshness tracking, provider status, and error reporting.
- Add authenticated user dashboard and saved alert rules.

### Phase 3: Monetization

- Add Supabase Auth.
- Enable Stripe Checkout for the Pro plan.
- Gate advanced indicators and alerts by subscription state.
- Add billing portal and subscription lifecycle webhooks.

## Pricing

- Free: delayed core indicators and limited alerts.
- Pro: $19/month for all MVP indicators, live dashboard, and alerts.
- Premium and Enterprise are marked as future plans and are not implemented in MVP.

## Success Criteria

- `npm run build` passes.
- `npm run lint` passes.
- Waitlist API validates email, stores normalized values in Supabase when configured, and returns clear JSON.
- Landing page has no dead internal links.
- Dashboard displays the six MVP indicators with consistent data shapes.
- Legal routes exist for privacy, terms, and disclaimer.
- No mojibake in app source files.

## Out of Scope for MVP

- FastAPI backend.
- Real money Stripe charges.
- AI Gold Health Score.
- Natural language trading assistant.
- Premium tier, API access, and enterprise workflows.
- Content calendar or YouTube operations.
