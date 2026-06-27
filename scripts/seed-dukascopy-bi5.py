import argparse
import concurrent.futures
import csv
import datetime as dt
import json
import lzma
import pathlib
import struct
import sys
import urllib.error
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "public" / "market-data"
DATAFEED_URL = "https://datafeed.dukascopy.com/datafeed"

SYMBOLS = [
    {"key": "xauusd", "label": "XAU/USD", "dukascopy": "XAUUSD", "scale": 1000},
    {"key": "eurusd", "label": "EUR/USD", "dukascopy": "EURUSD", "scale": 100000},
    {"key": "gbpusd", "label": "GBP/USD", "dukascopy": "GBPUSD", "scale": 100000},
    {"key": "audusd", "label": "AUD/USD", "dukascopy": "AUDUSD", "scale": 100000},
    {"key": "nzdusd", "label": "NZD/USD", "dukascopy": "NZDUSD", "scale": 100000},
    {"key": "usdcad", "label": "USD/CAD", "dukascopy": "USDCAD", "scale": 100000},
    {"key": "usdchf", "label": "USD/CHF", "dukascopy": "USDCHF", "scale": 100000},
    {"key": "usdjpy", "label": "USD/JPY", "dukascopy": "USDJPY", "scale": 1000},
    {"key": "xagusd", "label": "XAG/USD", "dukascopy": "XAGUSD", "scale": 1000},
    {"key": "usoil", "label": "US Oil", "dukascopy": "LIGHTCMDUSD", "scale": 1000},
]

TIMEFRAMES = {
    "5min": 5,
    "15min": 15,
    "1h": 60,
    "4h": 240,
    "1day": 1440,
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Download Dukascopy BI5 tick data and write Dralvo candle CSV datasets.",
    )
    parser.add_argument("--symbols", default=",".join(symbol["key"] for symbol in SYMBOLS))
    parser.add_argument("--timeframes", default=",".join(TIMEFRAMES.keys()))
    parser.add_argument("--days", type=int, default=180)
    parser.add_argument("--end-date", default=dt.datetime.utcnow().date().isoformat())
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--rebuild-manifest", action="store_true")
    return parser.parse_args()


def utc_hour_range(start_date, end_date):
    current = dt.datetime.combine(start_date, dt.time(0), tzinfo=dt.timezone.utc)
    end = dt.datetime.combine(end_date + dt.timedelta(days=1), dt.time(0), tzinfo=dt.timezone.utc)
    while current < end:
        yield current
        current += dt.timedelta(hours=1)


def bi5_url(symbol, hour):
    # Dukascopy months are zero-based in the path.
    month = hour.month - 1
    return f"{DATAFEED_URL}/{symbol['dukascopy']}/{hour.year}/{month:02d}/{hour.day:02d}/{hour.hour:02d}h_ticks.bi5"


def fetch_hour(symbol, hour, timeout):
    url = bi5_url(symbol, hour)
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            raw = response.read()
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return []
        raise
    except urllib.error.URLError:
        return []

    if not raw:
        return []

    try:
        data = lzma.decompress(raw)
    except lzma.LZMAError:
        return []

    candles = {}
    scale = symbol["scale"]
    for offset in range(0, len(data) - 19, 20):
        time_ms, ask_raw, bid_raw, ask_volume, bid_volume = struct.unpack(
            ">IIIff",
            data[offset : offset + 20],
        )
        tick_time = hour + dt.timedelta(milliseconds=time_ms)
        bucket = tick_time.replace(second=0, microsecond=0)
        ask = ask_raw / scale
        bid = bid_raw / scale
        price = (ask + bid) / 2
        spread = abs(ask - bid)
        volume = max(0.0, float(ask_volume) + float(bid_volume))

        candle = candles.get(bucket)
        if candle is None:
            candles[bucket] = {
                "time": bucket,
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": volume,
                "spread_sum": spread,
                "spread_count": 1,
            }
        else:
            candle["high"] = max(candle["high"], price)
            candle["low"] = min(candle["low"], price)
            candle["close"] = price
            candle["volume"] += volume
            candle["spread_sum"] += spread
            candle["spread_count"] += 1

    return [finalize_candle(candle, symbol) for candle in candles.values()]


def price_precision(symbol):
    return 3 if symbol["scale"] == 1000 else 5


def finalize_candle(candle, symbol):
    precision = price_precision(symbol)
    spread = candle["spread_sum"] / max(1, candle["spread_count"])
    return {
        "time": candle["time"],
        "open": round(candle["open"], precision),
        "high": round(candle["high"], precision),
        "low": round(candle["low"], precision),
        "close": round(candle["close"], precision),
        "volume": round(candle["volume"], 2),
        "spread": round(spread, precision),
    }


def resample(candles, minutes, symbol):
    if minutes == 1:
        return candles

    grouped = {}
    for candle in candles:
        timestamp = candle["time"]
        day_start = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        minute_of_day = timestamp.hour * 60 + timestamp.minute
        bucket_minute = (minute_of_day // minutes) * minutes
        bucket = day_start + dt.timedelta(minutes=bucket_minute)
        group = grouped.get(bucket)
        if group is None:
            grouped[bucket] = {
                "time": bucket,
                "open": candle["open"],
                "high": candle["high"],
                "low": candle["low"],
                "close": candle["close"],
                "volume": candle["volume"],
                "spread_sum": candle["spread"],
                "spread_count": 1,
            }
        else:
            group["high"] = max(group["high"], candle["high"])
            group["low"] = min(group["low"], candle["low"])
            group["close"] = candle["close"]
            group["volume"] += candle["volume"]
            group["spread_sum"] += candle["spread"]
            group["spread_count"] += 1

    return [finalize_candle(group, symbol) for _, group in sorted(grouped.items())]


def write_csv(symbol_key, timeframe, candles):
    directory = OUT_ROOT / symbol_key
    directory.mkdir(parents=True, exist_ok=True)
    file = directory / f"{timeframe}.csv"
    with file.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["time", "open", "high", "low", "close", "volume", "spread"])
        writer.writeheader()
        for candle in candles:
            row = dict(candle)
            row["time"] = candle["time"].isoformat().replace("+00:00", "Z")
            writer.writerow(row)


def parse_csv_time(value):
    if not value:
        return None
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))


def inspect_csv(symbol_key, timeframe):
    file = OUT_ROOT / symbol_key / f"{timeframe}.csv"
    if not file.exists():
        return None
    with file.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = [row for row in reader if row.get("time")]
    if not rows:
        return None
    return {
        "symbol": symbol_key,
        "timeframe": timeframe,
        "provider": "dukascopy-bi5",
        "path": f"/market-data/{symbol_key}/{timeframe}.csv",
        "candles": len(rows),
        "firstTime": parse_csv_time(rows[0]["time"]).isoformat().replace("+00:00", "Z"),
        "lastTime": parse_csv_time(rows[-1]["time"]).isoformat().replace("+00:00", "Z"),
        "generatedAt": dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def load_manifest_items():
    file = OUT_ROOT / "manifest.json"
    if not file.exists():
        return []
    try:
        manifest = json.loads(file.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return manifest.get("datasets", [])


def write_manifest(items):
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    sorted_items = sorted(items, key=lambda item: (item["symbol"], item["timeframe"]))
    manifest = {
        "version": 1,
        "source": "dukascopy-bi5",
        "generatedAt": dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "datasets": sorted_items,
    }
    (OUT_ROOT / "manifest.json").write_text(f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8")
    print(f"Wrote manifest with {len(sorted_items)} datasets")


def upsert_manifest_items(new_items):
    by_key = {
        (item.get("symbol"), item.get("timeframe")): item
        for item in load_manifest_items()
        if item.get("symbol") and item.get("timeframe")
    }
    for item in new_items:
        by_key[(item["symbol"], item["timeframe"])] = item
    write_manifest(list(by_key.values()))


def rebuild_manifest():
    items = []
    for symbol in SYMBOLS:
        for timeframe in TIMEFRAMES:
            item = inspect_csv(symbol["key"], timeframe)
            if item:
                items.append(item)
    write_manifest(items)


def download_symbol(symbol, hours, timeout, workers):
    candles = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(fetch_hour, symbol, hour, timeout) for hour in hours]
        for index, future in enumerate(concurrent.futures.as_completed(futures), start=1):
            try:
                candles.extend(future.result())
            except Exception as error:
                print(f"warn {symbol['key']}: {error}", file=sys.stderr)
            if index % 500 == 0:
                print(f"{symbol['key']}: downloaded {index}/{len(futures)} hours")

    return sorted(candles, key=lambda candle: candle["time"])


def main():
    args = parse_args()
    if args.rebuild_manifest:
        rebuild_manifest()
        return

    selected_keys = {key.strip() for key in args.symbols.split(",") if key.strip()}
    selected_timeframes = [item.strip() for item in args.timeframes.split(",") if item.strip()]
    selected_symbols = [symbol for symbol in SYMBOLS if symbol["key"] in selected_keys]
    unknown_timeframes = [item for item in selected_timeframes if item not in TIMEFRAMES]
    if unknown_timeframes:
        raise SystemExit(f"Unknown timeframes: {', '.join(unknown_timeframes)}")
    if not selected_symbols:
        raise SystemExit("No known symbols selected")

    end_date = dt.date.fromisoformat(args.end_date)
    start_date = end_date - dt.timedelta(days=args.days - 1)
    hours = list(utc_hour_range(start_date, end_date))
    manifest_items = []

    print(
        f"Downloading Dukascopy BI5 from {start_date.isoformat()} to {end_date.isoformat()} "
        f"({len(hours)} hours per symbol)"
    )
    for symbol in selected_symbols:
        m1 = download_symbol(symbol, hours, args.timeout, args.workers)
        if not m1:
            print(f"Skipped {symbol['key']}: no candles")
            continue

        for timeframe in selected_timeframes:
            candles = resample(m1, TIMEFRAMES[timeframe], symbol)
            if not candles:
                continue
            write_csv(symbol["key"], timeframe, candles)
            manifest_items.append(
                {
                    "symbol": symbol["key"],
                    "timeframe": timeframe,
                    "provider": "dukascopy-bi5",
                    "path": f"/market-data/{symbol['key']}/{timeframe}.csv",
                    "candles": len(candles),
                    "firstTime": candles[0]["time"].isoformat().replace("+00:00", "Z"),
                    "lastTime": candles[-1]["time"].isoformat().replace("+00:00", "Z"),
                    "generatedAt": dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc).isoformat().replace("+00:00", "Z"),
                }
            )
            print(f"Wrote {symbol['key']} {timeframe}: {len(candles)} candles")

    upsert_manifest_items(manifest_items)


if __name__ == "__main__":
    main()
