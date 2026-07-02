# Dralvo Product Truth and Strategy

> ⚠️ **TRẠNG THÁI (2026-07-01): doc này mô tả sản phẩm V1** (SaaS phân tích — "Pro" tier, alert rules / thesis monitors, indicators làm lõi). **Sản phẩm hiện tại là V2 và đã khác:**
> - Gói chỉ còn **Free + VIP** (bỏ "Pro"; nhãn hiển thị "VIP", tier nội bộ `Unlimited`).
> - **Alert rules / thesis monitors đã gỡ** — `/dashboard/alerts` redirect `/dashboard`; thông báo giờ = chuông + hộp thư + thông báo hệ thống + ticker.
> - Lõi sản phẩm = **EA** (goldmaster/goldscalp/tigold), license **per-EA** + chống share (`license_devices` + `max_accounts`).
> - **Affiliate** có đăng ký + dashboard + **rút tiền** (VN bank / USDT, chi trả thủ công).
> - Nguồn sự thật hiện hành: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) · [`HANDOFF.md`](./HANDOFF.md) · [`KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md). Nội dung dưới giữ làm tham chiếu lịch sử.

Date: 2026-06-12
Status: Working product agreement

## Source material

This synthesis was produced from:

- `xauusd-saas-feasibility-report.md`
- `xauusd-case-study-niche-indicators.md`
- `xauusd-niche-research-report.md`
- the current Dralvo codebase and git diff;
- `UI_UX_PRODUCTION_AUDIT.md`.

The source reports are research inputs, not automatically accepted product
facts. Claims are retained, reframed as hypotheses, or rejected according to
data feasibility and implementation evidence.

## Why this document exists

This document reconciles:

- the original XAUUSD niche-indicator research;
- the feasibility and case-study reports;
- the current implementation;
- the UI/UX and marketing audit.

It is the product source of truth. Landing copy, pricing, dashboard navigation,
data pipelines, and roadmap decisions should follow this document rather than
inventing separate versions of Dralvo.

## Executive decision

Dralvo should not compete with TradingView or MetaTrader as a charting or
technical-analysis platform.

Dralvo should be a gold-specific intelligence layer used alongside those
platforms:

> Dralvo turns fragmented physical-gold, positioning, flow, and macro data into
> an explainable XAUUSD market thesis, then tells users when that thesis changes.

The paid value is not access to RSI, MACD, SMA, candles, or generic price
alerts. Those are commodity features.

The paid value is:

1. collecting gold-specific data that is inconvenient to monitor;
2. normalizing sources with different cadences;
3. showing agreement and divergence between physical gold, paper positioning,
   flows, macro pressure, and price;
4. explaining what changed and why it matters;
5. monitoring a multi-factor thesis continuously.

## What the research got right

### 1. The useful problem is fragmented information

The niche research identifies a real workflow problem. A serious gold analyst
may need to visit SGE-related sources, CFTC reports, CME vault reports, ETF
issuer pages, FRED, central-bank data, LBMA references, and price platforms.

Even when the underlying data is public, collection and interpretation require
time and domain knowledge. The product opportunity is the reduction of that
work, not ownership of the raw public data.

### 2. The strongest angle is physical-versus-paper divergence

The case study's most valuable concept is not its hypothetical P&L. It is the
analytical question:

> Is price action being confirmed or contradicted by physical demand,
> positioning, inventory, and flows?

This creates a differentiated product surface:

- price falling while physical demand strengthens;
- price rising while ETF demand or positioning weakens;
- macro pressure improving while physical supply remains loose;
- multiple independent drivers changing regime together.

### 3. Different cadences can be an advantage

The source set includes intraday, daily, weekly, monthly, and quarterly data.
Trying to make all of it "real-time" would be misleading. Dralvo can instead
make cadence explicit and show what changed since the last valid observation.

The product should answer:

- What is fresh?
- What is unchanged because the source has not updated?
- Which slow-moving driver still matters?
- Which fast-moving driver just invalidated the current thesis?

### 4. Content can be the distribution engine

The Vietnamese content strategy is directionally useful:

- teach niche datasets;
- demonstrate the workflow using Dralvo;
- publish recurring market briefings;
- move viewers into a free product;
- learn which insights create repeat usage.

Content should validate demand before expensive data pipelines are expanded.

## What the research has not proven

The reports contain hypotheses and estimates, not validated business evidence.

### Market and commercial assumptions

Treat these as unverified:

- TAM/SAM values;
- 5% free-to-paid conversion;
- CAC, LTV, churn, and break-even projections;
- year-one paid-user targets;
- willingness to pay $19 or $39 per month;
- claims that seven of ten indicators have no meaningful competitor.

Required validation:

- user interviews;
- landing-page conversion;
- repeated weekly usage;
- pricing tests;
- retention after the initial curiosity period;
- evidence that users act differently because of the insight.

### Analytical assumptions

These interpretations must not be presented as established facts without
research and backtesting:

- rising Swap Dealer shorts always mean institutional accumulation;
- falling COMEX registered inventory directly predicts higher gold prices;
- ETF outflows are reliably contrarian;
- fixed SGE premium thresholds work across price regimes;
- a physical-paper divergence "always" resolves in favor of physical data;
- a four-driver agreement creates a known high-probability setup.

The product should present observations, historical context, and measured
relationships. It should not convert a narrative into certainty.

### GOFO

Official LBMA GOFO was discontinued in 2015. A modern proxy or third-party
measure may be useful, but it must not be labeled official GOFO unless it is.

Before including it:

- document the exact formula;
- obtain licensed forward data;
- identify benchmark and timezone;
- validate the proxy historically;
- label it as a proxy with methodology and limitations.

Until then, GOFO belongs in research, not the paid MVP.

### The case study

The case-study document explicitly states that the trade is hypothetical. It
must be used as a workflow illustration, not evidence of profitability,
predictive accuracy, or realized performance.

Remove or avoid:

- claims that the indicators correctly predicted the move;
- simulated account P&L presented as user outcome;
- language that encourages increasing position size because conviction is high;
- statements such as "the physical market never lies".

The safe and useful version is:

> A historical scenario showing how an analyst could re-check a thesis after a
> macro shock using several independent datasets.

## Current implementation truth

### Implemented platform capabilities

- Next.js application and dashboard routes.
- Supabase authentication and storage.
- Stripe subscription lifecycle.
- Alert rules and notification channels.
- Scheduled ingestion framework.
- Source, cadence, freshness, and data-quality fields.
- Twelve Data rate-limit-aware ingestion.
- FRED/Treasury and Binance-related integrations.

These are valuable infrastructure assets and should be retained.

### Current data product

The active indicator registry contains:

- XAUUSD Spot;
- RSI;
- MACD;
- SMA 50/200;
- TIPS Yields;
- Gold-BTC Correlation.

This is not the differentiated product described by the research.

### Why the niche fetchers were removed

The prior SGE, COT, COMEX, and ETF fetchers did not collect real source data:

- SGE premium was generated from a fixed base plus deterministic drift.
- COT change was hard-coded.
- COMEX inventory was generated from a date formula.
- ETF flows were simulated with sine cycles and deterministic noise.

Removing them was correct. Simulated niche data must never be restored to a
production financial product.

The next step is to build real pipelines, not to replace the product thesis
with common technical indicators.

## Product positioning

### Category

Gold decision intelligence.

### Required languages

The initial product must support:

- Vietnamese;
- English;
- Brazilian Portuguese.

The analytical engine is shared across languages. Localization happens in UI,
marketing, billing, legal, notifications, and explanatory thesis copy. Source
names, dataset identifiers, methodology versions, and numeric observations stay
canonical.

### Primary user

Self-directed XAUUSD traders and gold analysts who already use TradingView,
MetaTrader, or a broker platform but lack a repeatable fundamental and flow
workflow.

Initial market:

- Vietnamese, English, and Brazilian Portuguese users;
- intermediate rather than complete beginners;
- users who review gold several times per week;
- users who understand charts but do not consistently monitor specialist data.

### Job to be done

> Before I make or maintain an XAUUSD thesis, help me understand whether price,
> macro pressure, positioning, physical demand, inventory, and flows confirm
> each other, and alert me when that relationship materially changes.

### Product promise

> Know what is driving gold, what contradicts the current narrative, and what
> changed since your last review.

### What Dralvo is not

- Not a broker or execution terminal.
- Not a TradingView replacement.
- Not an MT5 replacement.
- Not a signal-selling service.
- Not an automated trading robot.
- Not a generic technical-indicator dashboard.
- Not financial advice.

## Product model

### Layer 1: Evidence

Each dataset must expose:

- raw current value;
- historical series;
- source and source URL;
- observed-at timestamp;
- expected next update;
- freshness and quality;
- transformation formula;
- known limitations.

### Layer 2: Interpretation

Each driver should answer:

- What changed?
- Is the change unusual relative to its own history?
- Does it confirm or contradict XAUUSD price?
- Which horizon is relevant?
- How strong is the evidence?

Interpretation must be rule-based and explainable before any AI-generated
summary is introduced.

### Layer 3: Thesis

A thesis is a user-readable, multi-driver state:

- supportive;
- mixed;
- adverse;
- insufficient data.

It includes:

- supporting drivers;
- contradicting drivers;
- stale or missing drivers;
- thesis age;
- conditions that would change it.

Do not call this a buy/sell signal.

### Layer 4: Monitoring

Users should be able to monitor thesis conditions such as:

> Notify me when physical demand strengthens while price falls and real yields
> stop rising.

This is the main recurring paid workflow.

## Data capability matrix

| Capability | Product value | Data feasibility | MVP decision |
|---|---|---|---|
| XAUUSD spot/history | Context only | Available through provider | Keep as foundation |
| TIPS real yields | Strong macro driver | FRED/Treasury, delayed daily | Keep and improve |
| CFTC COT positioning | Differentiated, weekly | Official public files | Build first |
| COMEX inventory | Differentiated, daily | Official report parsing/licensing review | Build first |
| Gold ETF holdings/flows | Differentiated, daily | Issuer files/pages; licensing review | Build first |
| SGE premium | High differentiation | Harder collection, currency/unit normalization | Prototype and validate |
| Central-bank reserves | Strategic context | Monthly/quarterly | Add after MVP |
| LBMA AM/PM price | Event/reference context | Licensing must be confirmed | Research |
| GOFO/lease proxy | Potentially valuable | Formula and licensed forwards required | Defer |
| Gold-BTC correlation | Supporting context | Easy | Keep, not premium anchor |
| RSI/MACD/SMA | Commodity functionality | Easy | Remove from paid proposition |
| Session VWAP | Chart context | Requires reliable volume model | Optional support feature |

## Recommended MVP

The previous six-card MVP was organized around data availability. The new MVP
should be organized around a user decision.

### MVP evidence set

Required:

1. XAUUSD price history.
2. TIPS real yields.
3. CFTC gold positioning with participant breakdown.
4. COMEX registered and eligible inventory.
5. GLD/IAU holdings or validated ETF-flow series.

Stretch:

6. SGE premium, only after a reliable and legally usable pipeline exists.

This set is enough to test macro, positioning, inventory, and flow divergence.
GOFO is not required to validate the core product.

### MVP experiences

#### Today

- Current gold thesis.
- What changed since the previous observation.
- Supporting and contradicting drivers.
- Data freshness and next scheduled updates.
- Upcoming relevant catalysts.

#### Drivers

- One workspace per driver.
- Historical chart and percentile.
- Relationship with XAUUSD over selected periods.
- Methodology and limitations.
- Change log.

#### Thesis monitor

- User chooses several conditions.
- Dralvo evaluates them when the underlying sources update.
- Notification explains which condition changed and links to evidence.

#### Historical replay

- Select a past period.
- Replay what each dataset showed at that time.
- Avoid look-ahead bias.
- Use this to validate interpretation rules and create educational cases.

Historical replay is more differentiated and credible than building another
full charting terminal.

## Chart strategy

Dralvo needs charts, but not a charting moat.

Use an established embeddable or lightweight chart for price context. Overlay
only Dralvo-owned intelligence:

- source update markers;
- thesis changes;
- macro-event markers;
- divergence windows;
- alert triggers;
- delayed/missing-data periods.

Do not prioritize:

- broker execution;
- dozens of drawing tools;
- hundreds of technical indicators;
- strategy scripting;
- competing with TradingView layouts.

## Free and paid packaging

Do not charge for the current technical-indicator dashboard.

### Paid-enabled validation

During early validation:

- Free and Pro remain available;
- Pro checkout stays live;
- real source data only;
- visible early-product labels where features are still maturing;
- collect behavior and interview feedback;
- test whether users return after weekly COT and daily inventory/flow updates.

### Free

- Current thesis summary.
- Limited history.
- One or two core drivers.
- Daily or source-cadence refresh.
- Methodology pages.
- One predefined monitor.

### Pro

Pro should sell differentiated, real-data workflow:

- all validated drivers;
- full historical series;
- divergence detection;
- custom thesis monitors;
- Telegram/email notifications;
- historical replay;
- export of licensed/derived data where permitted.

Initial pricing should be tested, not assumed. Keep one paid plan and no
Premium tier while CFTC, COMEX, and ETF are completed.

### Vietnam payment method

For the Vietnamese market, Pro should support VietQR bank transfer alongside
Stripe. Until bank webhook or automated reconciliation is implemented, VietQR
payments are manual-transfer requests:

- user creates a Pro VietQR request;
- Dralvo generates amount, account details, QR image, and transfer reference;
- admin confirms the bank transfer by reference;
- confirmed requests activate Pro.

## UI implications

The previous audit recommended turning Dashboard into Overview. With the
research synthesis, the information architecture should go further.

Recommended navigation:

- Today
- Drivers
- Replay
- Monitors
- Methodology
- Settings

Remove from primary navigation:

- generic Indicators;
- standalone Correlation matrix;
- full chart workstation as a top-level product;
- technical-alert framing.

The first screen should not show six unrelated cards. It should show one thesis
with an evidence trail.

## Marketing truth

### Approved positioning direction

Headline direction:

> See the gold market behind the price.

Supporting copy:

> Dralvo brings positioning, inventory, flows, real yields, and physical-demand
> evidence into one explainable XAUUSD thesis.

CTA direction during validation:

> Start Free

Secondary CTA:

> Upgrade to Pro

### Claims not allowed yet

- Real-time institutional data.
- Proprietary AI prediction.
- Proven high-probability signals.
- Predicts gold before the market.
- Data unavailable anywhere else.
- Profitable historical performance.
- Institutional-grade.
- All ten niche indicators.

### Claims allowed after implementation

- Data from named public or licensed sources.
- Automated normalization and update monitoring.
- Clear source cadence and freshness.
- Multi-driver divergence detection.
- Explainable thesis conditions.
- Alerts when source data or thesis conditions change.

## Validation plan

### Stage 1: Problem validation

Interview 15-20 active XAUUSD users.

Ask them to demonstrate:

- their current pre-trade review;
- data sources they already check;
- time spent gathering information;
- decisions changed by fundamental or flow data;
- alerts they wish existed;
- what they currently pay for.

Do not ask whether they "like the idea". Observe current behavior.

### Stage 2: Concierge product

Before automating every source:

- manually produce a daily/weekly Dralvo briefing;
- include four or five verified drivers;
- record source, timestamp, and interpretation;
- deliver through web and Telegram;
- measure opens, return visits, replies, and requested alerts.

This validates interpretation value before expensive scraping work.

### Stage 3: Data pipeline validation

For each source:

- ingest at least 12 months of history where possible;
- add automated freshness checks;
- compare against the source;
- document corrections and missing observations;
- confirm redistribution/licensing rights;
- measure pipeline maintenance cost.

### Stage 4: Paid validation

Keep one Pro plan available while measuring whether users repeatedly consume
the briefings, driver pages, and monitors.

Measure:

- weekly active users;
- briefing open rate;
- driver-detail views;
- monitor creation;
- notification engagement;
- four- and eight-week retention;
- conversion after the differentiated data is visible.

## Roadmap

### Phase 0: Stop misleading the market

- Pause or remove paid positioning based on common technical indicators.
- Correct landing, pricing, FAQ, and dashboard claims.
- Label current product as beta/demo where appropriate.
- Do not restore simulated niche indicators.

### Phase 1: Build the first real intelligence loop

- Implement CFTC positioning.
- Implement COMEX inventory.
- Implement ETF holdings/flow.
- Improve TIPS and XAUUSD history.
- Build Today thesis from transparent rules.
- Publish methodology.

### Phase 2: Prove recurring value

- Launch concierge briefings.
- Add change detection and divergence views.
- Add thesis monitors using the existing alert infrastructure.
- Interview users based on actual usage.

### Phase 3: Add the hardest moat

- Validate and implement SGE premium.
- Add historical replay.
- Add central-bank data.
- Refine the paid plan based on validated retention and willingness to pay.

### Phase 4: Expand carefully

- Add licensed LBMA references if commercially justified.
- Research a defensible lease-rate proxy.
- Ship multilingual delivery from the start for Vietnamese, English, and
  Brazilian Portuguese.
- Consider API access only after data licensing permits redistribution.

## Decisions made

1. Dralvo is an intelligence layer, not a charting terminal.
2. Niche gold data remains the product thesis.
3. Technical indicators remain supporting context, not paid differentiation.
4. Simulated financial data is prohibited in production.
5. GOFO is deferred until methodology and data rights are defensible.
6. The hypothetical case study is educational, not performance evidence.
7. One Free and one Pro plan are sufficient.
8. Pro remains available, but paid claims must be backed by real niche pipelines
   and recurring user value.
9. UI redesign follows the thesis-and-evidence model.
10. Marketing follows implemented capability, never roadmap aspiration.

## Immediate next decision

The next product milestone is not a dashboard redesign.

It is a working, verified data slice containing:

- CFTC gold positioning;
- COMEX gold inventory;
- ETF gold holdings/flows;
- TIPS real yields;
- XAUUSD price history.

Once this dataset exists, the first Today thesis and historical replay can be
built honestly. That is the point where the UI redesign becomes meaningful.
