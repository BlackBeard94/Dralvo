# Market Data Pipeline

This pipeline seeds default datasets for the free backtest tool without making a
provider request on every user run.

## Sources

- Twelve Data refreshes recent candles with `TWELVE_DATA_API_KEY`.
- Dukascopy is used as a historical backfill source through exported CSV files.
  Put converted/exported CSV files under `data/vendor/dukascopy/`.

## Output

Datasets are written to:

```text
public/market-data/manifest.json
public/market-data/{symbol}/{timeframe}.csv
```

The normalized CSV schema is:

```text
time,open,high,low,close,volume,spread
```

`time` must be UTC ISO text such as `2026-06-18T12:00:00Z`.

## Default Catalog

The initial catalog is:

- `xauusd`: `XAU/USD`
- `eurusd`: `EUR/USD`
- `gbpusd`: `GBP/USD`
- `usdjpy`: `USD/JPY`

Default timeframes:

- `5min`
- `15min`
- `1h`
- `4h`
- `1day`

## Commands

Refresh all configured datasets from Twelve Data:

```powershell
npm run data:seed:twelve
```

The script reads `TWELVE_DATA_API_KEY` from the current environment, `.env.local`,
or `.env`.

Import only local Dukascopy CSV files:

```powershell
npm run data:seed:dukascopy
```

Merge Dukascopy CSV history first, then refresh with Twelve Data:

```powershell
npm run data:seed
```

Limit a run while testing:

```powershell
npm run data:seed:twelve -- --symbols xauusd,eurusd --timeframes 1h,1day --outputsize 500
```

## Dukascopy CSV Layout

The script checks either of these paths:

```text
data/vendor/dukascopy/XAUUSD/1h.csv
data/vendor/dukascopy/XAUUSD_1h.csv
```

CSV headers may be normalized:

```text
time,open,high,low,close,volume,spread
```

or MT5-style:

```text
<DATE>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<TICKVOL>,<SPREAD>
```

For raw Dukascopy BI5/tick archives, convert them to OHLC CSV first, then place
the result in the paths above. This keeps the public app independent from heavy
tick decompression work and lets the browser consume compact candle data.

## Security

Never commit `.env` or provider keys. The script reads `TWELVE_DATA_API_KEY`
from the environment.
