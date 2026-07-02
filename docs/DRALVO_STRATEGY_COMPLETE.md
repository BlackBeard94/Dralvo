# Dralvo Tier 3A — Complete Strategy Reference

> ⚠️ **SỐ LIỆU CANONICAL:** dùng số trong code [`src/lib/backtest-stats.ts`](../src/lib/backtest-stats.ts).
> Chiến lược D1 này nay là **GoldMaster v1.08**: +792% · PF 2.40 · Win 39.4% · DD 23.6% · 94 lệnh. Các con số
> trong tài liệu này (164 trades / win 51% / PF 1.69 / +119% và các bảng year-by-year)
> là **CŨ/chưa khớp**, sẽ reconcile khi backtest engine (`dralvo-trading/backtest/`)
> chạy lại. Không dùng số trong doc này cho marketing.

> **Strategy:** CFTC + Trend + Pullback | **TF:** D1 | **Asset:** XAUUSD  
> **Backtest:** MT5 data 2006-2026 | 164 trades | Win 51% | PF 1.69 | Return +119%  
> **Indicator:** Dralvo v4.01 | File: `Dralvo_Gold_Filter.mq5` | CFTC from `cftc_status.csv`

---

## 1. Entry Conditions (ALL 3 MUST BE TRUE)

```
✅ Condition 1: CFTC Managed Money NET > 100,000 contracts
   → Source: CFTC.gov weekly COT report (contract 088691)
   → Data: MQL5/Files/cftc_status.csv (auto-generated, 7,472 days)
   → Update: re-run fetch script weekly after CFTC publishes (Friday)

✅ Condition 2: EMA50 > EMA200 on Daily chart
   → Confirms long-term uptrend
   → Filters out bear markets (e.g., 2013-2015: 0 signals)

✅ Condition 3: Price pullback ≥ -1.0% from 10-day high
   → Buy dips, don't chase rips
   → Only enter when price corrects from recent peak
```

## 2. Exit / Trade Management

```
Stop Loss:    Entry - 1.5 × ATR(14)
Take Profit:  Entry + 3.0 × ATR(14)
Max Hold:     7 trading days (close if neither SL nor TP hit)
```

## 3. Visual Reference (D1 Chart)

```
┌────────────────────────────────────────────────────────────┐
│  EMA200 ═══════════════════════════════════ (gray)         │
│                                                            │
│  EMA50  ─────────────────────────────── (orange)           │
│               ╲                                            │
│  EMA21  ──────╲────── (blue)                               │
│                ╲    🟢 BUY SIGNAL                          │
│  Price ────────╲───▲────────────────                       │
│                 ╲  │ Pullback -1%                          │
│                  ╲ │ SL: -1.5 ATR                          │
│                   ╲│ TP: +3.0 ATR                          │
│                    ╲                                        │
│  Conditions: CFTC ✓ | EMA50>200 ✓ | PB≥1% ✓               │
└────────────────────────────────────────────────────────────┘
```

## 4. Green Arrow = REAL Signal (all 3 conditions met)

### Examples from history

| Date | Entry | SL | TP | Result |
|------|-------|----|----|--------|
| 2025-03-12 | $2,940 | $2,890 | $3,030 | ✅ TP hit |
| 2024-08-05 | $2,400 | $2,360 | $2,470 | ✅ TP hit |
| 2024-04-15 | $2,370 | $2,330 | $2,440 | ✅ TP hit |
| 2023-10-02 | $1,830 | $1,810 | $1,870 | ❌ SL hit |
| 2020-11-30 | $1,770 | $1,740 | $1,820 | ✅ TP hit |
| 2016-10-04 | $1,270 | $1,250 | $1,310 | ❌ SL hit |

### Gray Arrow = Pullback exists but CFTC/Trend missing (IGNORE)

| Date | Why Ignored |
|------|-------------|
| 2013-2015 | CFTC bearish (gold bear market) |
| 2022-11 | EMA50 < EMA200 (downtrend) |

## 5. What You See On Chart

```
🟢 GREEN ▲ (up arrow)  = VALID SIGNAL (all 3 conditions)
⬜ GRAY  ▼ (down arrow) = Pullback only, missing CFTC or Trend

Info line (bottom left):
  DRALVO v4.01 | D1 | CFTC:BULL | TREND:UP | Sigs:164 | PB:-1.25% | Th:-1.00%

Blue line   = EMA21
Orange line = EMA50
Gray line   = EMA200
```

## 6. Backtest Summary (MT5 data, 2006-2026)

| Metric | Value |
|--------|-------|
| **Total trades** | 164 |
| **Win rate** | 50.6% |
| **Profit Factor** | 1.69 |
| **Total return** | +118.7% |
| **Avg win** | +3.52% |
| **Avg loss** | -2.14% |
| **Max consecutive wins** | 7 |
| **Max consecutive losses** | 5 |
| **Bear market (2013-2015)** | 0 trades (capital preserved) |

### Year-by-Year (MT5 data)

| Year | Gold B&H | Trades | Win% | P&L |
|------|:--------:|:------:|:----:|:---:|
| 2010 | +27% | 22 | 59% | +21% |
| 2011 | +10% | 20 | 65% | +28% |
| 2012 | +5% | 12 | 42% | -3% |
| 2013 | **-29%** | **0** | — | **0%** |
| 2014 | -3% | 0 | — | 0% |
| 2015 | -11% | 0 | — | 0% |
| 2016 | +7% | 15 | 47% | +2% |
| 2017 | +13% | 10 | 30% | -5% |
| 2018 | -3% | 5 | 60% | +1% |
| 2019 | +19% | 12 | 58% | +11% |
| 2020 | +24% | 18 | 72% | +24% |
| 2021 | -6% | 3 | 33% | -4% |
| 2022 | +1% | 8 | 50% | +3% |
| 2023 | +12% | 5 | 20% | -4% |
| 2024 | +27% | 18 | 67% | +18% |
| 2025 | +64% | 16 | 75% | +24% |

## 7. Risk Management

```
Risk per trade:   1-2% of account
Position size:    Risk amount / (SL in dollars)
Daily loss limit: 3% (stop trading if hit)
Consec. losses:   After 3 losses, reduce size 50%
Max positions:    1 XAUUSD at a time
News filter:      No entry 30min before/after FOMC, NFP, CPI
```

### Account Simulation ($10,000, 1% risk)

```
Final: ~$20,000 (+100%) over 16 years
Max DD: ~8%
Worst year: 2017 (-$250)
Best year: 2011 (+$2,800)
```

## 8. File Locations

```
Indicator:  MQL5/Indicators/Dralvo_Gold_Filter.mq5
CFTC Data:  MQL5/Files/cftc_status.csv (auto-generated)
Backtest:   scripts/backtest/simulate_account.py
Data:       scripts/backtest/data/raw/cftc_20y.json
MT5 H4:     C:/Users/Admin/.hermes/desktop-attachments/XAUUSD_H4_2006_2026.csv
```

## 9. Weekly Routine

```
Monday-Friday (5 min/day):
  1. Open MT5 → D1 chart with Dralvo indicator
  2. Check info line: CFTC:BULL? TREND:UP? PB near -1%?
  3. If green arrow appears: evaluate entry
  4. If no signal: do nothing

Friday (after 3:30 PM ET):
  1. CFTC publishes COT report
  2. Run fetch script to update cftc_status.csv
  3. Compile indicator (F7) to reload CFTC data
```

## 10. Known Limitations

```
1. CFTC data is weekly (published Friday, data from Tuesday)
   → 3-day lag. Price may have already moved before signal.

2. Strategy is LONG ONLY
   → No short signals. During bear markets, do nothing.

3. ~1 trade per month average
   → Not suitable for traders wanting daily action.

4. Win rate 50.6% means you WILL lose 5 in a row sometimes
   → Risk management is critical. Never risk more than 2%.

5. Backtest performance ≠ future performance
   → Past edge may not persist. Always forward-test.
```

---

> **Indicator v4.01** | Compiled: F7 in MetaEditor | Attach to XAUUSD D1 chart  
> **Questions:** Telegram @dralvogold | Web: dralvo.com
