# Dralvo Gold Filter — MT5 Indicator Specification

> **Version:** 3.05 | **Target:** MetaTrader 5 (MQL5)  
> **Strategy:** Tier 3A — CFTC+Trend+Pullback-1%+ATR  
> **Backtest:** 20 years (2006-2025) | 246 trades | Win 60% | PF 2.10 | +171% return

---

## 1. Strategy Logic (The Edge)

### Entry Conditions (ALL must be true)

```
1. Price pullback from N-bar high >= PullbackThreshold%
2. ATR(14) > 0 (valid volatility)
3. [Optional] EMA50 > EMA200 (trend filter, off by default)
```

### Exit Conditions (execution layer, not part of indicator)

```
Stop Loss:   Entry - SL_Multiplier × ATR(14)  (default: 1.5)
Take Profit: Entry + TP_Multiplier × ATR(14)  (default: 3.0)
Max Hold:    7 days (D1), proportionally adjusted for other TF
```

### Why This Works

- **CFTC filter** (Managed Money net > 100K) confirms smart money is long gold
- **EMA50 > EMA200** confirms the trend is structurally bullish
- **Pullback -1%** ensures we buy dips, not chase rips
- **ATR-based SL/TP** adapts to volatility automatically

See full backtest: `docs/DRALVO_STRATEGY_SYSTEM.md`

---

## 2. Indicator Visual Output

### 2.1 Lines (always visible)

| Element | Type | Color | Style | Width |
|---------|------|-------|-------|-------|
| EMA(21) | Line | DodgerBlue (#1E90FF) | Solid | 2 |
| EMA(50) | Line | Orange (#FFA500) | Solid | 2 |
| EMA(200) | Line | Gray (#808080) | Solid | 1 |

### 2.2 Arrows (DRAW_ARROW buffers)

| Signal | Arrow Code | Color | Width | Position |
|--------|-----------|-------|-------|----------|
| BUY (trend OK) | Wingdings 233 (▲) | Lime (#00FF00) | 5 | Below candle low |
| WARN (no trend) | Wingdings 234 (▼) | DimGray (#696969) | 3 | Below candle low |

- **Min spacing:** 3 bars between signals (avoid clutter)
- **Lifetime:** All historical signals visible, not just recent

### 2.3 Horizontal Levels (OBJ_HLINE — visible on ALL timeframes)

For the `MaxLevels` most recent signals:

| Level | Color | Style | Width | Description |
|-------|-------|-------|-------|-------------|
| Entry | Gold (#FFD700) | Dotted | 2 | Entry price |
| Stop Loss | Red (#FF0000) | Dotted | 1 | SL price |
| Take Profit | Lime (#00FF00) | Dotted | 1 | TP price |

- **Persistence:** HLINE objects survive timeframe switches — a D1 entry level remains visible on H1, H4, M15
- **Creation:** Only create if `ObjectFind()` returns < 0 (don't recreate existing objects)
- **Cleanup:** Delete on `OnDeinit()` only, NOT on every `OnCalculate()`
- **Back drawing:** `OBJPROP_BACK = true` (draw behind candles)

### 2.4 Info Panel (Comment string, bottom-left corner)

```
DRALVO v3.05 | D1 | Sigs:246 | PB:-1.25% | Th:-1.00% | ATR:850
```

| Field | Meaning |
|-------|---------|
| D1 | Current timeframe |
| Sigs | Total valid signals found |
| PB | Current pullback % |
| Th | Pullback threshold being used |
| ATR | ATR(14) value in points |

### 2.5 Alert (only on NEW signal at current bar)

```
Alert: "DRALVO D1 BUY: 2025.06.15 00:00 PB:-1.25% E:2650.50 SL:2635.20 TP:2680.30"
```

- **Debounce:** `LastAlert` datetime — only alert once per bar
- **Only on:** The most recent completed bar, not historical bars

---

## 3. Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| MAP1 | int | 21 | EMA Fast period |
| MAP2 | int | 50 | EMA Medium period |
| MAP3 | int | 200 | EMA Slow period |
| ATRP | int | 14 | ATR period |
| PBPct | double | 0 | Pullback threshold %. **0 = auto-adapt to timeframe.** Set to negative value to override. |
| PBBars | int | 10 | Lookback bars for pullback high |
| SLxATR | double | 1.5 | Stop Loss multiplier (× ATR) |
| TPxATR | double | 3.0 | Take Profit multiplier (× ATR) |
| TrendF | bool | false | Enable EMA50>200 trend filter |
| ShowLevels | bool | true | Show HLINE entry/SL/TP levels |
| MaxLevels | int | 10 | Max recent signals to draw HLINEs for |

### Auto-adapt Pullback Threshold (when PBPct = 0)

| Timeframe | Threshold |
|-----------|:---------:|
| M1 | -0.05% |
| M5 | -0.10% |
| M15 | -0.15% |
| M30 | -0.20% |
| H1 | -0.25% |
| H4 | -0.40% |
| D1 | -1.00% |
| W1 | -2.00% |
| MN1 | -4.00% |

---

## 4. Technical Implementation

### 4.1 File Structure

```
MQL5/Indicators/Dralvo_Gold_Filter.mq5  → source
MQL5/Indicators/Dralvo_Gold_Filter.ex5  → compiled
```

### 4.2 Buffer Layout (must match plot order)

| Index | Buffer | Plot # | Plot Type | Content |
|-------|--------|--------|-----------|---------|
| 0 | EMA21B | 1 | DRAW_LINE | EMA(21) values |
| 1 | EMA50B | 2 | DRAW_LINE | EMA(50) values |
| 2 | EMA200B | 3 | DRAW_LINE | EMA(200) values |
| 3 | BuyB | 4 | DRAW_ARROW | Buy signal positions |
| 4 | WarnB | 5 | DRAW_ARROW | Warning signal positions |
| 5 | ATRB | — | DRAW_NONE | ATR(14) values (internal) |

> ⚠️ **CRITICAL:** Buffers 0-4 are used by plots. Buffer order must match `#property indicator_typeN` order exactly. Put ATR in the LAST buffer (index 5) since it's DRAW_NONE.

### 4.3 Performance Requirements

- **Do NOT recalculate all history on every tick** — just update the current bar and check for new signals
- **Use `prev_calculated`** to skip already-calculated bars
- **Object creation:** Check `ObjectFind() < 0` before creating — don't recreate on every tick
- **Object deletion:** Only on `OnDeinit()`, NOT in `OnCalculate()` (prevents flickering)
- **For loop:** `for(int i = start; i < rt && !IsStopped(); i++)` — always check `!IsStopped()`

### 4.4 Signal Detection Algorithm

```
1. Calculate indicators for all bars (EMA, ATR, pullback%)
2. Scan bars from start to rt:
   a. Skip if less than 3 bars from last signal (avoid clutter)
   b. Skip if ATR <= 0
   c. Calculate pullback % from PBBars-period high
   d. If pullback <= threshold AND (trend OK or trend filter OFF):
      - Set BuyB[i] = arrow position
      - Store signal data for HLINE drawing
      - If this is the LATEST bar AND not already alerted: Alert()
   e. If pullback <= threshold BUT trend filter fails:
      - Set WarnB[i] = arrow position (gray down arrow)
3. Draw HLINEs for the MaxLevels most recent signals
4. Update Comment() with info
```

### 4.5 Helper Functions Required

```cpp
double CalcE(const double &price[], int index, int period, double &buffer[])
// Calculate EMA at index

double CalcAT(const double &high[], const double &low[], const double &close[], int index, int period)
// Calculate ATR at index

double Thresh(int timeframe)
// Return auto-adapt pullback threshold for given timeframe

string TF(int timeframe)
// Return timeframe name string (M1, M5, H1, H4, D1, etc.)
```

---

## 5. Constants / Magic Numbers

| Constant | Value | Meaning |
|----------|-------|---------|
| Signal spacing | 3 bars | Min bars between consecutive BUY signals |
| Arrow Y offset | ATR × 0.5 | How far below candle low to place arrow |
| Alert debounce | Per-bar datetime | Only alert once per bar |

---

## 6. Testing Checklist

After implementing, verify:

- [ ] EMA21, EMA50, EMA200 lines visible on chart
- [ ] Green ▲ arrows appear at pullback entry points (historical + live)
- [ ] Gray ▼ arrows appear at pullback points where trend filter blocked
- [ ] Gold/Red/Green HLINEs visible at entry/SL/TP levels
- [ ] Switch to H1 — HLINEs remain visible at same prices
- [ ] `Comment()` shows signal count, pullback%, threshold, ATR
- [ ] Alert fires ONCE when new signal appears (not spamming)
- [ ] Change PBPct to -0.5 — threshold changes, signals update
- [ ] Toggle TrendF on/off — signals update
- [ ] Remove indicator — all objects and Comment cleared
- [ ] No flickering or object duplication

---

## 7. Known Pitfalls

1. **Buffer indexing:** Plot #4 uses buffer[3], Plot #5 uses buffer[4]. Double-check.
2. **EMPTY_VALUE:** Must be set to 0 for DRAW_ARROW, otherwise all bars show arrows.
3. **OBJ_HLINE persistence:** These objects survive indicator re-init. Must delete in OnDeinit.
4. **ArrayMaximum crash:** Ensure `i - PBBars >= 0` before calling.
5. **prev_calculated:** Use `pc > 0 ? pc - 1 : start` pattern to avoid recalculating on every tick.
6. **IsStopped():** Always check in for loops to allow clean shutdown.

---

## 8. Future Enhancements (NOT required for v3.05)

- [ ] CFTC data integration (fetch MM net from web API)
- [ ] Real-time CFTC regime display (green/yellow/red background)
- [ ] Auto-trade EA version (Expert Advisor)
- [ ] Multi-timeframe dashboard panel
- [ ] Push notification to Telegram on signal
- [ ] Myfxbook auto-publish

---

> **Source reference:** `E:\Dralvo\dralvo-landing\scripts\Dralvo_Gold_Filter.mq5`  
> **Strategy document:** `E:\Dralvo\dralvo-landing\docs\DRALVO_STRATEGY_SYSTEM.md`  
> **Backtest scripts:** `E:\Dralvo\dralvo-landing\scripts\backtest\`
