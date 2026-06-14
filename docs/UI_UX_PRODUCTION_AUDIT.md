# Dralvo UI/UX Production Audit

Date: 2026-06-12

Product decisions and capability claims in this audit are subordinate to
[`PRODUCT_TRUTH_AND_STRATEGY.md`](./PRODUCT_TRUTH_AND_STRATEGY.md). The product
strategy defines what Dralvo is; this audit defines how that product should be
presented and operated.

## Executive assessment

Dralvo already has a coherent dark/gold visual direction, working responsive
navigation, loading/error states, and separate routes for the major product
areas. The main problem is not a lack of styling. It is that `/dashboard`
duplicates nearly the entire application, which weakens information hierarchy,
increases client polling, and makes the product feel like a long technical demo
instead of a focused decision tool.

The production redesign should make Dashboard an overview and move detailed
work into the existing Chart, Indicators, Correlation, Alerts, and Settings
routes.

## P0: Trust and data integrity

These items must be resolved before presenting the interface as production
financial intelligence.

1. Clearly label simulated, estimated, delayed, cached, and live values.
2. Do not show controls that only change labels. The chart timeframe buttons
   currently update `activeTf`, but do not request or calculate different
   timeframe data.
3. Replace generated volume with provider volume, or label it as estimated.
4. Remove the calculated "52W High/Low" values until real 52-week data exists.
5. Replace the hard-coded correlation matrix with stored calculations and a
   visible observation window and last-updated timestamp.
6. Rename "AI Signal" unless an actual model produces it. The current value is
   a deterministic RSI/trend heuristic.
7. Never silently mix fallback data with live data. Show a persistent data
   quality state at page and component level.

Production rule: every financial number must expose source, freshness, quality,
and fallback state.

## P1: Information architecture

### Dashboard becomes Overview

Keep only:

- Market status: XAUUSD price, change, market session, freshness.
- Composite signal: bullish/neutral/bearish counts and confidence explanation.
- Compact chart preview with a "View full chart" action.
- Top 3 indicators with a "View all indicators" action.
- Two or three strongest cross-asset relationships.
- Alert summary: active rules, latest trigger, "Manage alerts".
- Data health and current plan in a compact utility area.

Remove from the overview:

- Full candlestick workstation.
- All six full indicator cards.
- Full correlation matrix.
- Alert rule editor.
- Notification preferences.
- Repeated upgrade overlays inside every section.

### Existing routes become workspaces

- `/dashboard`: Overview.
- `/dashboard/chart`: Full chart and technical context.
- `/dashboard/indicators`: All indicators, filtering, sorting, explanations.
- `/dashboard/correlation`: Full matrix and relationship insights.
- `/dashboard/alerts`: Rules, event history, delivery status.
- `/dashboard/settings`: Profile, notifications, billing, data preferences.

Rename the sidebar item "Dashboard" to "Overview". Group navigation into:

- Monitor: Overview, Chart, Indicators, Correlation.
- Automate: Alerts.
- Account: Settings.

## P1: Visual hierarchy and design system

1. Use a readable proportional font for body copy and UI labels. Keep
   JetBrains Mono only for prices, timestamps, identifiers, and tabular data.
2. Establish a consistent type scale. Avoid using 9px and 10px text for
   important labels; target at least 12px for secondary UI text and 14px for
   body content.
3. Adopt an 8px spacing system and standard component sizes:
   - control heights: 32, 40, 48px;
   - card padding: 16 or 24px;
   - page gaps: 24 or 32px;
   - radii: 8, 12, 16px.
4. Reduce decorative noise and global transitions. `body *` currently applies
   transitions to every element, which can make dense screens feel sluggish.
5. Reserve gold for selected states, primary actions, and key values. Too many
   gold labels reduce its ability to communicate priority.
6. Use green and red only for directional or semantic states, with icons/text
   so meaning does not depend on color.
7. Standardize cards into variants: metric, chart, insight, empty, locked,
   warning, and error.
8. Add a real page title/breadcrumb to the top bar. It currently always says
   "Dashboard", including on child routes.

## P1: Free-to-Pro experience

The current overview repeats upgrade prompts across the banner, locked
indicators, correlation, and alerts. This creates pressure without helping the
user understand value.

Replace it with:

- One dismissible upgrade callout on Overview.
- Inline lock badges on unavailable navigation or cards.
- A useful preview of locked features, not a large blur over content.
- Upgrade copy tied to outcomes: more signals, custom monitoring, and delivery
  channels.
- A plan usage panel showing what is included and what limit was reached.

Do not block half of a long page with repeated overlays.

## P1: Responsive and accessibility

1. Increase interactive targets to at least 40x40px; use 44x44px on mobile.
2. Ensure collapsed-sidebar tooltips can be reached by keyboard focus, not only
   mouse hover.
3. Implement full dropdown focus management: focus first item on open, arrow
   navigation, and return focus on close.
4. Give charts an accessible text summary and data table alternative.
5. Make matrix cells keyboard focusable and expose row, column, value,
   direction, and strength.
6. Validate muted text contrast in both themes. Several muted 9-10px labels are
   likely difficult to read even when the raw contrast technically passes.
7. Use a bottom navigation or compact mobile navigation for the four most
   frequent destinations. A drawer alone adds friction for repeated monitoring.
8. Reflow chart controls and market metrics instead of hiding most context at
   smaller breakpoints.

## P1: Polling and perceived performance

The current Overview mounts three independent pollers:

- Market header: `/api/xauusd` every 30 seconds.
- Chart: `/api/xauusd` every 60 seconds.
- Indicator stream: `/api/indicators` every 30 seconds.

An open Overview tab therefore makes about 7,200 internal API requests per day:
4,320 to `/api/xauusd` and 2,880 to `/api/indicators`. This is not necessarily
the same as 7,200 Twelve Data requests because server caching may absorb them,
but it is unnecessary client traffic.

Recommended:

- Create one shared market-data provider/store per dashboard session.
- Deduplicate identical `/api/xauusd` requests.
- Pause polling when the tab is hidden.
- Refresh based on actual data cadence, not a universal 30-second interval.
- Add visible "Last updated" and a manual refresh action.
- Use stale-while-revalidate behavior and keep the last valid value on errors.
- Lazy-load below-the-fold modules and route-specific code.

## P2: Product polish

- Add customizable watchlist or pinned indicators.
- Add saved dashboard layout only after the default overview is strong.
- Add first-run onboarding with three steps: understand signal, inspect source,
  create alert.
- Add contextual help for RSI, MACD, TIPS, correlation, and data-quality labels.
- Add alert activity timeline and delivery success/failure state.
- Add consistent empty states with one clear next action.
- Add command/search navigation only if route count grows.
- Add product analytics for route usage, CTA clicks, alert creation, upgrade
  impressions, and activation.

## Recommended implementation order

### Phase 1: Production credibility

- Fix or label simulated metrics and non-functional controls.
- Add data source/freshness metadata.
- Replace fake 52-week range and hard-coded claims.
- Correct page titles and navigation naming.

### Phase 2: Dashboard restructuring

- Replace the long Dashboard with a compact Overview.
- Reuse existing route pages for full-detail workflows.
- Deduplicate market polling through a shared provider.

### Phase 3: Design system

- Introduce typography, spacing, control, surface, and semantic tokens.
- Build shared PageHeader, SectionHeader, MetricCard, StatusBadge,
  UpgradeCallout, EmptyState, ErrorState, and Skeleton components.
- Remove one-off styling and repeated locked-panel markup.

### Phase 4: Accessibility and mobile

- Keyboard and focus audit.
- Chart/matrix alternatives.
- Contrast and target-size audit.
- Mobile navigation and dense-data reflow.

### Phase 5: Validation

- Test Free and Pro accounts separately.
- Test loading, stale, cached, offline, empty, and error states.
- Test widths at 360, 768, 1024, 1440, and 1920px.
- Run visual regression, Playwright flows, accessibility checks, and Core Web
  Vitals measurements.

## Acceptance criteria

- A new user understands price, market bias, freshness, and the next action
  within five seconds.
- The Overview fits its primary decision content within roughly two desktop
  viewports.
- No financial metric appears live or model-generated unless it actually is.
- No duplicated client poller requests the same resource.
- All routes have correct titles, active navigation, loading, empty, stale, and
  error states.
- Keyboard-only users can operate navigation, menus, chart controls, alerts,
  and correlation cells.
- Important mobile actions use at least 44px targets.
- Build, lint, and automated UI checks pass.

## Verification completed

- `npm run lint`: passed with zero warnings.
- `npm run build`: passed; all dashboard routes compiled.
- Static audit covered dashboard shell, navigation, overview, chart,
  indicators, correlation, alerts, settings, loading/error states, theme
  tokens, polling, login, and signup.
- Live authenticated visual inspection remains to be performed when a browser
  session and test account are available.

---

# Public Site, Auth, and Legal Audit

## P0: Marketing claims must match the product

The public pages currently describe multiple incompatible versions of Dralvo.
This is the highest-priority site-wide issue.

The landing page advertises SGE premium, COT positioning, COMEX inventory, and
ETF flows. Those fetchers are no longer present. The current indicator set is:

- XAUUSD Spot
- RSI (14)
- MACD (12,26,9)
- SMA 50/200 Crossover
- TIPS Yields
- Gold-BTC Correlation

The fallback entries for all six are currently marked `simulated`.

Other claims that must be removed or qualified until verified:

- "Real-time data pipeline"
- "No delays, no stale numbers"
- "Institutional-grade gold intelligence"
- "Market depth"
- "AI Signal" and "AI Gold Health Score"
- Five alerts, multi-condition alerts, and advanced AND/OR alert chains
- Same-day support
- API access and custom layouts presented alongside available plans
- Apple Pay and Google Pay support unless enabled and tested in Stripe
- "Early users get full Pro access" unless this entitlement exists

Create one product capability matrix and generate landing, pricing, FAQ, and
in-app plan copy from the same source. Each feature needs one state:
`available`, `beta`, `planned`, or `unavailable`.

## Landing page audit

### Positioning and conversion

Strengths:

- Clear XAUUSD specialization.
- Coherent visual identity.
- Multiple routes to signup and pricing.
- Financial disclaimer is visible.

Required changes:

1. Replace the metaphor-heavy headline with a concrete outcome. A visitor
   should understand the product within five seconds.
2. Choose one primary CTA. The header currently offers "Create account" and
   "Start Free" beside each other, while the hero adds "View Demo".
3. Make "View Demo" open an actual public demo. It currently links to the
   authenticated dashboard and redirects visitors to login.
4. Replace feature lists with the real six-indicator set and accurate data
   quality.
5. Add evidence near the hero: a truthful product screenshot, data-source
   explanation, freshness example, or short workflow demonstration.
6. Add trust information relevant to a financial-data product: source labels,
   update cadence, delayed-data policy, security statement, and support contact.
7. Remove roadmap features from active pricing cards. Put them in a clearly
   labeled roadmap section if they are useful for demand validation.
8. Consolidate repeated sections. The page is long and repeats product,
   pricing, signup, and disclaimer messages without adding proof.

### Broken or misleading interactions

- The "Docs" section does not provide usable public documentation. Markdown
  paths under `/docs/*.md` are not public routes, and the current cards for
  those paths render as non-clickable blocks with "Read more".
- "Dashboard Preview" links to a protected route.
- All pricing cards on the landing use the same "Start Free" label, including
  Premium/teams.
- Premium sends users to signup instead of a contact-sales or waitlist flow.
- The landing imports a live chart preview and dashboard mockup. These are
  expensive product components, not lightweight marketing illustrations.

### Public-page polling

The landing page mounts:

- `ChartPreview`, polling `/api/xauusd` every 60 seconds.
- `DashboardMockup`, polling `/api/indicators` every 30 seconds.

An idle landing tab can therefore make about 4,320 internal API requests per
day. A marketing page should use a static, server-rendered, or snapshot preview.
It should not maintain a live dashboard session before signup.

### Recommended landing structure

1. Header: Product, Data, Pricing, FAQ, Sign in, Start free.
2. Hero: specific outcome, one primary CTA, public product preview.
3. Product proof: real screenshot and freshness/source annotations.
4. Core workflow: Monitor, Understand, Alert.
5. Real feature set grouped by Free and Pro.
6. Data transparency section.
7. Pricing summary.
8. FAQ and final CTA.
9. Disclaimer and footer.

## Pricing page audit

### Plan consistency

The landing and dedicated pricing page describe different Free and Pro
features. This will create billing disputes and support burden.

Required:

- Define exact limits for indicators, alerts, export, refresh cadence, and
  correlation access.
- State whether the trial requires a payment method.
- State billing currency, taxes, renewal behavior, cancellation effect, and
  refund policy.
- Separate available features from planned features.
- Do not call data real-time unless the provider entitlement and actual cadence
  support that claim.

### Interaction issues

- `checkingAuth` is tracked but not used to prevent plan-state flicker.
- The Free "Current Plan" is still rendered as a link to `/signup`; visual
  disabled styling does not disable navigation.
- The bottom "Go Pro" CTA repeats checkout without adding plan context.
- Checkout errors appear only near the relevant button and may be missed after
  a redirect attempt.
- Logged-out users are redirected to signup without preserving the intended
  Pro checkout action.

Recommended:

- Use one pricing comparison table with explicit limits.
- Add a monthly/annual selector only when annual billing exists.
- Preserve checkout intent through signup/login.
- Show current plan and billing status without layout flicker.
- Add a compact "What counts as an alert/data refresh?" explanation.

Completed note, 2026-06-13:

- Pro checkout intent is now preserved from pricing through signup/login and
  Supabase email verification by using an internal checkout continuation route:
  `/api/stripe/checkout?intent=pro`.
- Auth redirects now reject external destinations and only continue to internal
  paths, reducing open-redirect risk in login/signup/callback flows.
- Pricing plan CTAs now render disabled buttons instead of clickable links when
  the current plan is already active or auth status is still loading.
- Checkout return states now have visible UI: pricing explains cancelled/error
  Stripe returns, and dashboard explains success, missing-session, and sync
  failure outcomes.

## Login, signup, and password recovery audit

### P0 functional issue

Password recovery is incomplete. The email callback redirects to
`/reset-password?update=true`, but that page always displays the email-request
form. There is no UI to enter and confirm a new password.

Implement two explicit states:

1. Request reset email.
2. Set and confirm new password for a valid recovery session.

Also handle expired/invalid links with a route back to request another email.

### Signup and login improvements

- Add `autocomplete="email"`, `current-password`, and `new-password`.
- Display password requirements before submission, not only after failure.
- Add a password strength/requirement checklist without overcomplicating signup.
- Translate raw Supabase errors into user-safe, actionable messages.
- Read and display `?error=auth_callback_error` on login.
- Add legal microcopy: account creation implies agreement to Terms and Privacy.
- Add resend-verification handling and an email-change option on the success
  screen.
- Preserve the original destination through login, signup, verification, and
  checkout.
- Consider Google authentication only if target-user research supports it.

The current email/password-only form is appropriately short. Do not add profile,
role, or company fields before users reach product value.

## Shared navigation and theme

`GlobalThemeToggle` renders on every route except `/` and `/pricing`. Because it
has no fixed-position wrapper, it participates in normal document flow. It also
appears on dashboard routes that already include a theme toggle.

Required:

- Remove the global body-level toggle.
- Put theme control inside each shared public/auth/legal/dashboard shell.
- Persist one theme implementation; dashboard currently uses a separate state
  mechanism from the shared `ThemeToggle`.
- Use one responsive public header across landing, pricing, and legal pages.

Other navigation issues:

- Pricing navigation links unauthenticated users directly to `/dashboard`.
- Footer Dashboard and Docs links lead to protected or non-documentation
  experiences.
- External Twitter/GitHub URLs should be verified or removed before launch.
- Auth pages expose a Deerflow outbound link in a high-conversion flow; move
  agency attribution to the footer or remove it from authentication screens.

## Legal pages audit

The legal pages are visually consistent. Earlier copy described an MVP or
future launch:

- Privacy says account features may arrive "in later phases".
- Terms says Stripe applies "when Stripe payments are enabled".
- Terms describes beta access while paid checkout is already implemented.

Completed note, 2026-06-13:

- Legal copy now removes MVP/as-is/active-development language from Privacy and
  Terms.
- Terms now include account access, Pro billing, trial, cancellation,
  tax/refund dependency, and availability language aligned with paid Pro while
  keeping the financial-risk disclaimer separate.

Before accepting payment, legal text should be reviewed for the actual business
entity and jurisdiction. At minimum it needs:

- Legal entity and contact address.
- Effective date and version history.
- Subscription, renewal, cancellation, refund, and tax terms.
- Acceptable use and account termination.
- Intellectual property and license.
- Warranty disclaimer and limitation of liability.
- Governing law and dispute process.
- Data retention, deletion, cookies, processors, and international transfers.
- Market-data licensing and redistribution limitations.
- Explicit risk language appropriate to XAUUSD, leveraged products, and delayed
  or simulated data.

This is a legal-review requirement, not only a copywriting task.

## SEO and discoverability audit

### Canonical and metadata

The root layout defines canonical `/`. Pages that do not override it may signal
that landing is the canonical URL for pricing, legal, and auth pages.

Required:

- Set a self-referencing canonical for every indexable public page.
- Add page-specific metadata for pricing.
- Add `noindex, nofollow` metadata to login, signup, reset-password, auth
  callbacks, dashboard, and other private application routes.
- Avoid page titles such as `"Privacy Policy | Dralvo"` when the root title
  template already appends `| Dralvo`.
- Add unique Open Graph title, description, and URL for pricing and major
  public content.

### Content and route gaps

- There is no custom 404 page.
- There is no real public docs/help route.
- Sitemap excludes login appropriately but should use actual content update
  dates and include future public data/methodology pages.
- Robots currently allows all paths; explicitly disallow or noindex private
  application areas.
- Add structured data only after pricing, organization, and product facts are
  stable.

## Public accessibility audit

- FAQ buttons need `aria-expanded`, `aria-controls`, and stable panel IDs.
- Open FAQ content should use suitable region semantics.
- Mobile menu should close on Escape, trap/restore focus when appropriate, and
  expose the controlled menu ID.
- Inputs need autocomplete attributes and error association through
  `aria-describedby`.
- Form status and asynchronous errors need `aria-live`.
- Small 10-11px labels and 32px controls should be increased.
- Decorative symbols should be hidden from assistive technology.
- Product previews and charts need text alternatives.
- Focus treatment should be standardized across links, buttons, accordions,
  and form controls.

## Public performance and architecture

The landing and pricing pages are large client components. This forces content,
navigation, FAQ, and pricing copy into the client bundle even when most of it is
static.

Recommended:

- Make public pages server components.
- Isolate only mobile menu, theme switch, FAQ, and checkout controls as client
  islands.
- Replace live dashboard components with optimized static previews.
- Use `next/image` for raster product imagery.
- Remove Google Fonts `@import`; use `next/font` consistently.
- Remove global `body *` transitions.
- Share one public Header, PricingTable, FAQ, CTA, and Footer implementation.
- Split the 800+ line landing page into semantic sections with centralized
  product copy.

## Expanded implementation order

## Implementation update - 2026-06-13

Completed in the public product:

- Replaced predictive-sounding hero language with the approved
  "See the gold market behind the price" direction in VI, EN, and PT-BR.
- Reduced the desktop and mobile header to one primary Start Free CTA.
- Replaced the protected dashboard "demo" link with a public methodology path.
- Published `/methodology` with the five production sources, honest cadence,
  decision questions, process, and source limitations.
- Replaced fake internal docs cards with working methodology anchors.
- Removed anonymous Dashboard links and unverified social links from the
  public footer.
- Updated footer positioning from technical analysis to gold decision
  intelligence.
- Made VietQR marketing reflect its current unconfigured bank state while
  retaining the implemented payment infrastructure.
- Added FAQ expanded/control/region semantics.
- Added Methodology to the sitemap and updated the default product title.
- Added self-referencing canonical metadata for pricing, methodology, and legal
  pages; removed auth from the sitemap; and applied noindex rules to auth and
  dashboard routes.
- Added a branded custom 404 page and explicit robots exclusions for private
  application and API paths.
- Completed a mobile Lighthouse accessibility pass for the public funnel:
  landing and pricing now score 100 for accessibility, best practices, SEO, and
  agentic browsing locally; methodology scores 100 for accessibility, best
  practices, SEO, and agentic browsing with only a small acceptable CLS
  residual; login, signup, and reset-password score 100 for accessibility,
  best practices, and agentic browsing, with SEO intentionally reduced by
  `noindex`.
- Improved light-theme contrast by separating readable gold text from CTA gold
  backgrounds, darkening muted text, and darkening semantic green labels.
- Removed the global `body *` transition rule that animated every color and
  border change, reducing unnecessary non-composited animations and layout
  shift risk.
- Added main landmarks, larger password visibility hit targets, and
  autocomplete hints to auth forms.
- Completed password recovery: `/reset-password` now supports both requesting a
  reset link and setting a new password from a valid recovery session, with
  expired-link handling and localized validation copy.

Still required before a fully closed production launch:

- Real Vietnamese bank credentials and reconciliation operation for VietQR.
- Business-entity and jurisdiction-specific legal review.
- Full keyboard and screen-reader validation in the deployed production
  environment.
- Real-user four- and eight-week retention evidence.

### Phase 0: Product truth

- Create a single capability matrix.
- Correct landing, pricing, FAQ, metadata, and in-app copy.
- Remove or explicitly label simulated/live/planned functionality.
- Fix password recovery.

### Phase 1: Public conversion path

- Rebuild landing hierarchy around one CTA and a real public demo.
- Align pricing and checkout intent.
- Clean login/signup microcopy and destination preservation.
- Completed: password recovery now includes the set-new-password state after a
  recovery callback.

### Phase 2: Shared foundations

- Consolidate theme handling and public shells.
- Introduce shared typography, spacing, button, card, form, FAQ, and navigation
  components.
- Convert static public content to server components.

### Phase 3: Legal and SEO

- Complete legal review before production billing.
- Correct canonical, indexing, metadata, sitemap, and 404 behavior.
- Publish real methodology/data-source documentation.

### Phase 4: Accessibility and validation

- Keyboard and screen-reader audit across every public and private route.
- Test auth recovery, verification, checkout return, cancellation, and expired
  sessions.
- Measure landing LCP, CLS, INP, JavaScript payload, and unnecessary API calls.
