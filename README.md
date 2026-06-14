# Dralvo

Dralvo is a live SaaS product for XAUUSD analysis. It provides a focused gold dashboard, Supabase Auth, Stripe-backed Pro billing, alert rules, and email/Telegram/in-app notifications.

## Quick Start

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local development.
- `npm run build` - create production build.
- `npm run start` - serve production build.
- `npm run lint` - run ESLint.
- `npm run audit:encoding` - check for mojibake patterns.
- `npm run telegram:webhook` - set the Telegram bot webhook to `https://www.dralvo.com/api/telegram/webhook`.

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
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
TWELVE_DATA_API_KEY=
FRED_API_KEY=
```

Production uses:

```env
NEXT_PUBLIC_SITE_URL=https://www.dralvo.com
```

Server-only secrets must not be exposed to client components.

## Product Model

- Free: core dashboard access.
- Pro: $19/month with a real 3-day Stripe trial.
- Premium/Enterprise: future roadmap.

## Billing

- Checkout route: `/api/stripe/checkout`
- Checkout success sync: `/api/stripe/checkout/success`
- Billing portal route: `/api/stripe/portal`
- Webhook route: `/api/stripe/webhook`
- Production webhook URL: `https://www.dralvo.com/api/stripe/webhook`

The dashboard displays Free, Pro, Trialing, Canceled, or payment issue states based on the `subscriptions` table.

## Alerts And Notifications

- Alert APIs are Pro-gated server-side.
- In-app notifications are stored in `alert_notifications`.
- Email notifications use SMTP env vars.
- Telegram notifications use a bot webhook and short-lived one-time connect codes.
- Alert evaluation route: `/api/alerts/evaluate`

## Cron

Vercel Hobby only allows daily cron jobs. Current `vercel.json` is daily and deploy-safe. For 5-minute alert evaluation, use Vercel Pro or an external scheduler with:

```text
Authorization: Bearer <CRON_SECRET>
```

## Project Structure

- `src/app` - Next.js pages, route handlers, SEO files, and proxy.
- `src/components` - shared UI, marketing, and dashboard components.
- `src/data` - indicator seed data and ingestion fetchers.
- `src/lib` - server integrations and utilities.
- `docs` - product plan, architecture, and deployment notes.
- `supabase` - canonical schema and migrations.

## Product Docs

- [Product Truth and Strategy](docs/PRODUCT_TRUTH_AND_STRATEGY.md)
- [UI/UX Production Audit](docs/UI_UX_PRODUCTION_AUDIT.md)
- [Project Plan](docs/PROJECT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)

## Legal

Dralvo is for informational purposes only and is not financial advice.
