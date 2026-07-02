# DRALVO STRATEGY SYSTEM — Complete Reference

> ⚠️ **SỐ LIỆU CANONICAL:** dùng số trong code [`src/lib/backtest-stats.ts`](../src/lib/backtest-stats.ts).
> Chiến lược D1 này nay là **GoldMaster v1.08**: +792% · PF 2.40 · Win 39.4% · DD 23.6% · 94 lệnh. Các bảng
> backtest per-tier / year-by-year dưới đây (win 55-60%, PF 2.1...) là **CŨ/chưa
> khớp**, sẽ reconcile khi backtest engine (`dralvo-trading/backtest/`) chạy lại.
> Không dùng số trong doc này cho marketing.

> **Version:** 2.0 | **Date:** 2026-06-15  
> **Asset:** XAUUSD (Gold) | **Direction:** LONG ONLY  
> **Backtest:** 20 years (2006-2025), 5,029 trading days, 835 CFTC weeks  

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Tier 1: H1 Scalp](#2-tier-1-h1-scalp)
3. [Tier 2: H4 Day Trade](#3-tier-2-h4-day-trade)
4. [Tier 3: D1 Swing (Core)](#4-tier-3-d1-swing-core)
5. [Tier 4: D1 Quality](#5-tier-4-d1-quality)
6. [Tier 5: H4+D1 Multi-Timeframe](#6-tier-5-h4d1-multi-timeframe)
7. [Risk Management](#7-risk-management)
8. [Weekly Signal Calendar](#8-weekly-signal-calendar)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Core Principles

Rules that apply to ALL tiers:

| # | Rule | Reason |
|---|------|--------|
| 1 | **LONG ONLY** | Gold +722% in 20 years. Shorting = fighting the trend |
| 2 | **CFTC is the #1 filter** | Managed Money net > 100K = bullish regime |
| 3 | **ALWAYS wait for pullback** | Entry on pullback improves win rate +6-12% |
| 4 | **ATR-based SL/TP > fixed** | Adapts to volatility automatically |
| 5 | **≤3 conditions per strategy** | More filters = fewer trades, NOT better quality |
| 6 | **No RSI/MACD/ADX as primary** | These degrade PF on gold |
| 7 | **No SHORT — stand aside instead** | When CFTC bearish, do nothing |

---

## 2. Tier 1: H1 Scalp

**Style:** Intraday quick trades | **Hold:** hours | **Check:** 2-4 times/day

### Entry Rules

```
IF all conditions true → ENTER LONG:

[1] CFTC Managed Money NET > 100,000 contracts
    (updated weekly, forward-filled to daily)

[2] Price pullback ≥ -0.5% from 8-period high on H1

[3] Current H1 candle closing above open (bullish bias)
```

### Exit Rules

```
Stop Loss:   Entry - 1.5 × ATR(14) on H1
Take Profit: Entry + 2.5 × ATR(14) on H1
Max Hold:    8 candles (1 trading day)
Session:     Only trade London (07:00-16:00 GMT)
```

### Backtest Results (2024-2025, 13,720 H1 candles)

| Metric | Value |
|--------|-------|
| Total trades (2yr) | ~120 |
| Trades/year | ~60 |
| Trades/week | ~1.2 |
| Win rate | ~58% |
| Profit Factor | ~1.85 |
| Avg hold | ~4 hours |
| Best in | Strong trend days |
| Worst in | Choppy/low volatility days |

### Trader Profile

```
✅ Có thời gian xem chart vài lần/ngày
✅ Thích hành động, không thích chờ
✅ Chấp nhận win rate ~58%
✅ Vốn nhỏ, muốn compound nhanh
```

---

## 3. Tier 2: H4 Day Trade

**Style:** Short swing 1-2 days | **Hold:** 1-2 days | **Check:** Once daily

### Entry Rules

```
IF all conditions true → ENTER LONG:

[1] CFTC Managed Money NET > 100,000 contracts

[2] Price touches or is below EMA21 on H4

[3] H4 candle closes bullish (close > open)
```

### Exit Rules

```
Stop Loss:   Below EMA50 on H4
Take Profit: Recent 20-candle high on H4, or 3R minimum
Max Hold:    12 candles (2 trading days)
```

### Backtest Results (2024-2025, 3,707 H4 candles)

| Metric | Value |
|--------|-------|
| Total trades (2yr) | ~94 |
| Trades/year | ~47 |
| Trades/week | ~0.9 |
| Win rate | ~62% |
| Profit Factor | ~1.77 |
| Avg hold | ~24 hours |
| Best in | Trending weeks |
| Worst in | Range-bound weeks |

### Trader Profile

```
✅ Check chart 1 lần/ngày
✅ Muốn win rate cao, tâm lý thoải mái
✅ Không muốn ngồi máy cả ngày
✅ Có công việc khác ngoài trading
```

---

## 4. Tier 3: D1 Swing (Core) ⭐

**Style:** Medium-term swing | **Hold:** 5-20 days | **Check:** 5 min/day

This is the FLAGSHIP strategy. 20-year backtest with highest return.

### Entry Rules

```
IF all conditions true → ENTER LONG:

[1] CFTC Managed Money NET > 100,000 contracts
    Source: cftc.gov/dea/newcot/f_disagg.txt (contract 088691)

[2] EMA50 > EMA200 on Daily chart
    Xác nhận xu hướng tăng dài hạn

[3] Price pullback ≥ -1.0% from 10-day high
    Mua khi giá giảm, không mua đuổi
```

### Exit Rules

```
VERSION A — CONSERVATIVE (Fixed SL/TP):
  Stop Loss:   Entry - 1.5 × ATR(14) on D1
  Take Profit: Entry + 3.0 × ATR(14) on D1  
  Max Hold:    7 trading days

VERSION B — AGGRESSIVE (Trailing Stop):
  Trailing:    Highest close since entry - 1.5 × ATR(14) on D1
  Max Hold:    15 trading days
  
VERSION C — BALANCED (Recommended):
  Trailing:    Highest close since entry - 2.0 × ATR(14) on D1
  Max Hold:    20 trading days
```

### Backtest Results — 20 Years (2006-2025)

| Version | Trades | Win% | PF | Return | AvgW | AvgL | MaxDDyr |
|---------|:------:|:----:|:---:|:------:|:----:|:----:|:-------:|
| A: Fixed SL/TP | 246 | 60% | 2.10 | +171% | +2.2% | -1.6% | 0%* |
| B: Trail 1.5ATR | 185 | 49% | 2.67 | +200% | +3.5% | -1.3% | 0%* |
| C: Trail 2.0ATR | 158 | 55% | 2.59 | +180% | +3.4% | -1.6% | 0%* |

> *Strategy had 0 trades during 2013-2015 gold bear market (-37%). Best drawdown protection.

### Year-by-Year Performance (Version A)

| Year | Gold B&H | Trades | Win% | P&L |
|------|:--------:|:------:|:----:|:---:|
| 2010 | +27% | 29 | 62% | +27% |
| 2011 | +10% | 31 | 68% | +38% |
| 2012 | +5% | 19 | 47% | +2% |
| **2013** | **-29%** | **0** | — | **0%** |
| **2014** | **-3%** | **0** | — | **0%** |
| **2015** | **-11%** | **0** | — | **0%** |
| 2016 | +7% | 25 | 48% | 0% |
| 2017 | +13% | 18 | 33% | -3% |
| 2018 | -3% | 7 | 57% | 0% |
| 2019 | +19% | 16 | 56% | +10% |
| 2020 | +24% | 25 | 80% | +36% |
| 2021 | -6% | 4 | 25% | -3% |
| 2024 | +27% | 26 | 69% | +23% |
| 2025 | +64% | 29 | 76% | +40% |

### Trader Profile

```
✅ Bận rộn, chỉ check chart 5 phút/ngày
✅ Vốn trung bình đến lớn
✅ Kiên nhẫn, không cần trade nhiều
✅ Muốn chiến lược có backtest 20 năm
✅ Đây là tier DEFAULT cho mọi người dùng Dralvo
```

---

## 5. Tier 4: D1 Quality

**Style:** Ultra-selective, high confidence | **Hold:** 3-7 days | **Check:** Weekly

### Entry Rules

```
IF all conditions true → ENTER LONG:

[1] CFTC Managed Money NET > 150,000 contracts
    (stricter than Tier 3)

[2] EMA50 > EMA200 on Daily

[3] Price pullback ≥ -0.8% from 10-day high

[4] RSI(14) < 45
    (only ADDITIONAL filter that helps — catches oversold in uptrend)
```

### Exit Rules

```
Stop Loss:   Entry - 1.5 × ATR(14) on D1
Take Profit: Entry + 3.0 × ATR(14) on D1
Max Hold:    7 trading days
```

### Backtest Results — 20 Years

| Metric | Value |
|--------|-------|
| Total trades | ~90 |
| Trades/year | ~5 |
| Win rate | ~57% |
| Profit Factor | 1.92 |
| Consecutive months without trade | Up to 3 |

### Trader Profile

```
✅ Vốn rất lớn, không muốn rủi ro
✅ Cực kỳ kiên nhẫn (2-3 tháng/lệnh)
✅ Dùng tín hiệu này như "bonus" bên cạnh Tier 3
✅ Không phù hợp làm strategy chính — quá ít trade
```

---

## 6. Tier 5: H4+D1 Multi-Timeframe

**Style:** Precision entry | **Hold:** 5-10 days | **Check:** 1-2 times/day

### Entry Rules

```
IF all conditions true → ENTER LONG:

[1] D1 Regime: CFTC > 100K AND EMA50 > EMA200
    (same as Tier 3 — daily context is bullish)

[2] D1 Entry Zone: Price near or below EMA21 on Daily
    (D1 says "good time to be looking for longs")

[3] H4 Trigger: Price pullback -1% from 8-candle high on H4
    AND H4 candle closes with body > 50% of range
    (H4 says "pullback is ending, momentum returning")
```

### Exit Rules

```
Stop Loss:   Below nearest swing low on H4
Exit:        When D1 closes below EMA50 (trend break)
             OR trailing 1.5 ATR from H4 swing high
Max Hold:    10 trading days
```

### Expected Performance (composite of Tier 2 + Tier 3 logic)

| Metric | Value |
|--------|-------|
| Trades/year | ~12 |
| Trades/month | ~1 |
| Expected Win rate | ~60% |
| Expected PF | ~2.0-2.2 |

### Trader Profile

```
✅ Chuyên nghiệp, hiểu multi-timeframe analysis
✅ Muốn entry chính xác nhất có thể
✅ Sẵn sàng bỏ lỡ trade nếu H4 không xác nhận
✅ Kết hợp Tier 3 (regime) + Tier 2 (entry timing)
```

---

## 7. Risk Management

### Position Sizing (all tiers)

```
Risk per trade: 1-2% of account
Lot size = (Account × Risk%) / (SL in dollars)

Example: $10,000 account, 2% risk, $60 SL
  → Risk = $200 → Lots to risk $200 with $60 SL
```

### Daily Loss Limit

```
Max daily loss: 3% of account
If hit: stop trading for the day
```

### Consecutive Loss Rule

```
After 3 consecutive losses: reduce position size by 50%
After 5 consecutive losses: stop trading for 1 week, review
```

### News Filter

```
No new entries 30 minutes before/after:
  - FOMC decision
  - NFP (Non-Farm Payrolls)
  - CPI (Consumer Price Index)
```

### Correlation

```
Only 1 XAUUSD position open at a time
(Can have Tier 1 + Tier 3 open simultaneously if different entries)
```

---

## 8. Weekly Signal Calendar

### Every Day (Market Status)

```
📊 DRALVO MARKET STATUS
  CFTC: 🟢 Bullish (MM net: XXX,XXX)
  Trend: EMA50 > EMA200 ✅
  DXY: ▼ / ▲ / →
  TIPS: ▼ / ▲ / →
  Overall: 🟢 FAVOR LONG / 🟡 NEUTRAL / 🔴 STAND ASIDE
```

### Typical Week

| Day | Content |
|-----|---------|
| **Monday** | Market Status + Weekend review |
| **Tuesday** | Market Status + possible H1/H4 signal |
| **Wednesday** | Market Status + midweek D1 update |
| **Thursday** | Market Status + possible H1/H4 signal |
| **Friday** | Market Status + CFTC report watch |
| **Saturday** | Weekly D1 analysis + Tier 3 update |
| **Sunday** | Weekly preview + key levels |

### Monthly

| Week | Extra Content |
|------|--------------|
| Week 1 | Monthly performance recap |
| Week 2 | — |
| Week 3 | — |
| Week 4 | CFTC deep dive analysis |

---

## 9. Implementation Checklist

### Phase 1: MT5 Indicator (2 weeks)

- [ ] Display CFTC regime (green/yellow/red) on chart
- [ ] Plot EMA21, EMA50, EMA200
- [ ] Show ATR(14) value
- [ ] Alert on pullback -1% (Tier 3 entry)
- [ ] Draw trailing stop line (Tier 3 exit)
- [ ] Show entry/signal markers for Tier 1-2-3

### Phase 2: Telegram Bot (1 week)

- [ ] Daily Market Status (auto-post 7AM GMT+7)
- [ ] Alert on Tier 3 entry signal
- [ ] Alert on Tier 1-2 signals (optional, PRO only)
- [ ] Weekly summary every Saturday

### Phase 3: Website Dashboard (2 weeks)

- [ ] Real-time CFTC regime display
- [ ] Historical replay tool (spot-check any date)
- [ ] Data provenance page (links to CFTC, FRED)
- [ ] Strategy documentation public

### Phase 4: PRO Monetization (ongoing)

- [ ] Bot EA (Expert Advisor) for Tier 3 auto-trading
- [ ] Multi-TF dashboard (Tier 5)
- [ ] Telegram VIP channel (real-time signals)
- [ ] Myfxbook public track record

---

> **Full backtest data:** `scripts/backtest/data/`  
> **Backtest scripts:** `scripts/backtest/run_20y_backtest.py`, `systematic_scan.py`  
> **20-year data files:** `*_20y.json` in `data/raw/`
