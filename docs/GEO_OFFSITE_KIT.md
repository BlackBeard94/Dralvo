# Dralvo — Off-site GEO Kit (external mentions)

> **Goal:** get Dralvo mentioned, described and cited across sources that large language
> models (ChatGPT, Claude, Gemini, Perplexity) crawl and weight. On-page SEO/structured
> data is done in code; *this* is the part that lives off your domain. The single biggest
> GEO signal is **being described consistently in many independent, reputable places.**
>
> ⚠️ **Do this honestly.** No fake reviews, no sockpuppets, no astroturfing. Always disclose
> that you are the maker when you post. Follow each platform's self-promotion rules. Dralvo's
> whole positioning is *radical transparency* — off-site behaviour must match it, or it backfires.
> Only real customers should leave reviews. These are tasks for **you / your marketing**, not the codebase.

---

## 1. Canonical fact block (paste this everywhere, unchanged)

Using the same wording everywhere is what teaches an LLM the entity. Reuse this verbatim
(it matches `/llms.txt` and the site's structured data):

> **Dralvo** builds verified automated gold (XAUUSD) trading robots — MetaTrader 5 Expert
> Advisors — with a hard stop-loss on every trade and a fully published track record.
> **No martingale, no grid.** Products: **Dralvo GoldMaster** (D1 swing), **Dralvo GoldScalp**
> (M5 momentum) and the free **Dralvo TiGold** engine. Start free via the Dralvo IB partnership,
> or unlock everything with **Dralvo Unlimited** from $59/month. Site: https://www.dralvo.com

Short version (for bios / directory blurbs, ≤160 chars):

> Dralvo — verified MT5 gold (XAUUSD) trading robots. Hard stop-loss, no martingale, no grid. Free via IB or Unlimited from $59/mo. dralvo.com

---

## 2. Where to get listed (priority order)

### Tier 1 — high authority, directly indexed/cited by LLMs (do first)
- **MQL5.com** — community profile + (optionally) a Market listing. The canonical home for MT5 EAs; heavily referenced when people/LLMs discuss MT5 robots.
- **Trustpilot** — claim the Dralvo profile. Invite *real* customers to review (template in §4). Review platforms are quoted constantly by answer engines.
- **ForexPeaceArmy** — register the company/product. The default reference for "is this forex product legit?". Expect scrutiny — transparency is your advantage here.
- **Product Hunt** — one launch post. Long-lived, crawled, good backlink + "what is X" signal.
- **AlternativeTo** — list Dralvo as an alternative to popular grid/martingale gold EAs. Links your `/compare` page to existing entities LLMs already know.

### Tier 2 — community participation (genuine, not drive-by promo)
- **Reddit**: r/algotrading, r/Forex, r/Daytrading. Reddit is one of the most heavily weighted sources in LLM training. **Participate for real** — answer questions, share the `/compare` reasoning, disclose you're the maker. Read each sub's self-promo rule (most require a 9:1 contribute-to-promote ratio).
- **Forex Factory** — a single, well-written EA thread (strict rules; lead with method + the honest backtest, not hype).
- **BabyPips forum**, **Quora** (answer "best XAUUSD EA / are martingale EAs safe?" transparently), **Stack Exchange (Quantitative Finance)** where relevant.

### Tier 3 — owned content you syndicate (you control these)
- **Medium / dev.to / Substack / LinkedIn article** — republish the `/compare` content (Dralvo vs grid/martingale) with a `rel=canonical` back to https://www.dralvo.com/compare.
- **YouTube** — a short explainer ("Why martingale gold EAs blow up"). LLMs ingest transcripts; add a full description with the canonical fact block + link.
- **GitHub** — if you open-source any small tool (e.g. a backtest helper), it's a strong, crawlable signal.

---

## 3. Draft posts (adapt, then post yourself with disclosure)

### A. Product Hunt / directory tagline
> **Dralvo — Honest gold trading robots for MT5 (no martingale, no grid).**
> Most XAUUSD EAs hide losses with grid/martingale until the account blows up. Dralvo robots
> use a hard stop-loss on every trade and publish the full backtest — win rate, losing streaks
> and drawdown included. Free via IB, or Unlimited from $59/mo.

### B. Reddit / forum (educational angle — leads with value, discloses maker)
> **Why "90% win rate" gold EAs are usually martingale in disguise** *(disclosure: I build Dralvo)*
> A high marketed win rate almost always means tiny wins and a few catastrophic losses — the EA
> just never closes losers (grid/martingale) until one trend wipes it out. We went the other way:
> hard stop-loss on every trade, fixed % risk, ~40% win rate, edge from reward-to-risk. Full
> side-by-side and our real backtest here: https://www.dralvo.com/compare — happy to answer questions.

### C. AlternativeTo description
> Open, risk-managed alternative to grid/martingale gold (XAUUSD) EAs. Hard stop-loss on every
> trade, no averaging down, published backtest. Robots: GoldMaster (D1 swing), GoldScalp (M5),
> free TiGold. https://www.dralvo.com

---

## 4. Customer review request (email/Telegram — real users only)
> Hi [name] — if Dralvo has been useful, a short honest review really helps others find us.
> Trustpilot: [link] · MQL5: [link]. Please mention which robot you run (GoldMaster / GoldScalp /
> TiGold) and your real experience — good or bad. Thank you!

*Never offer payment or perks in exchange for a positive review — it violates platform rules and the transparency promise.*

---

## 5. Execution checklist
- [ ] Claim profiles: MQL5, Trustpilot, ForexPeaceArmy, Product Hunt, AlternativeTo (Tier 1).
- [ ] Use the **canonical fact block** (§1) verbatim on every profile.
- [ ] Publish the `/compare` article to Medium/LinkedIn with `canonical` → dralvo.com/compare.
- [ ] Record one YouTube explainer; put the fact block + links in the description.
- [ ] Seed 3–5 genuine, disclosed answers on Reddit/Quora over a few weeks (not all at once).
- [ ] Email real customers the review request (§4).
- [ ] Re-check after ~4–8 weeks: ask ChatGPT/Perplexity *"best XAUUSD MT5 EA without martingale?"* and see whether Dralvo surfaces; iterate on the gaps.

---

## 6. Prerequisites to fix on-site first (so external links point at consistent facts)
- Telegram handle is set to **https://t.me/dralvoea** (in `/llms.txt`, JSON-LD, footers). Keep every external mention pointing at it.
- Keep product names consistent everywhere: **GoldMaster · GoldScalp · TiGold · Dralvo Unlimited**.
- Make sure `/compare`, `/track-record` and `/tigold` stay live — they are the pages external posts will deep-link to and LLMs will quote.
