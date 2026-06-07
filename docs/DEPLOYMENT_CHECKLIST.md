# Deployment Checklist — Phase 1

## Pre-deploy Verification

- [x] `npm run build` passes (Turbopack, 12 static pages, 4 API routes)
- [x] `npm run lint` passes (0 errors, 0 warnings)
- [x] Git baseline commit created (`229dd8f`)
- [x] CI workflow added (`.github/workflows/ci.yml`)
- [x] Dependency audit reviewed — 2 moderate accepted (see `DEPENDENCY_AUDIT.md`)

## Required Environment Variables

Set these in Vercel dashboard → Project → Settings → Environment Variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Production URL, e.g. `https://dralvo.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | From Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | From Supabase → Project Settings → API → service_role key. **Must stay server-only.** |
| `CRON_SECRET` | ✅ | Random string for securing `/api/ingest`. Generate: `openssl rand -hex 32` |
| `TWELVE_DATA_API_KEY` | ⏳ Phase 2 | Twelve Data API key for live gold data |
| `FRED_API_KEY` | ⏳ Phase 2 | FRED API key for TIPS yields |

## Supabase Setup (before first deploy)

1. Create a Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
5. Verify: insert a test row into `waitlist_signups`

## Vercel Deploy

```bash
# From E:\Dralvo\dralvo-landing
vercel --prod
```

Or connect the GitHub repo to Vercel for auto-deploy on push.

## Post-deploy Verification

- [ ] Landing page loads at production URL
- [ ] `/dashboard` renders all 6 indicator cards
- [ ] `/api/waitlist` returns 503 when Supabase not configured, or 201/200 when configured
- [ ] `/api/indicators` returns 6 indicator snapshots
- [ ] `/api/xauusd` returns OHLC candles + spot price
- [ ] `/privacy`, `/terms`, `/disclaimer` all render
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/robots.txt` returns valid robots
- [ ] `/manifest.webmanifest` returns valid manifest
- [ ] OpenGraph image renders at `/opengraph-image`
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive: sidebar collapses, cards stack, no horizontal overflow
- [ ] Waitlist form: valid email → success, duplicate → "already on list", invalid → error

## Cron Job (Phase 2)

Once `CRON_SECRET` and data API keys are set, Vercel cron will call `/api/ingest` every 5 minutes.
Verify in Vercel → Project → Cron Jobs.
