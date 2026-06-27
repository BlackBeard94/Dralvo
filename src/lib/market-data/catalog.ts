import type { MarketDataSymbol, MarketDataTimeframe } from "./types";

export const MARKET_DATA_TIMEFRAMES: MarketDataTimeframe[] = [
  "5min",
  "15min",
  "1h",
  "4h",
  "1day",
];

export const MARKET_DATA_SYMBOLS: MarketDataSymbol[] = [
  {
    key: "xauusd",
    label: "XAU/USD",
    twelveDataSymbol: "XAU/USD",
    dukascopySymbol: "XAUUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "eurusd",
    label: "EUR/USD",
    twelveDataSymbol: "EUR/USD",
    dukascopySymbol: "EURUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "gbpusd",
    label: "GBP/USD",
    twelveDataSymbol: "GBP/USD",
    dukascopySymbol: "GBPUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "audusd",
    label: "AUD/USD",
    twelveDataSymbol: "AUD/USD",
    dukascopySymbol: "AUDUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "nzdusd",
    label: "NZD/USD",
    twelveDataSymbol: "NZD/USD",
    dukascopySymbol: "NZDUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "usdcad",
    label: "USD/CAD",
    twelveDataSymbol: "USD/CAD",
    dukascopySymbol: "USDCAD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "usdchf",
    label: "USD/CHF",
    twelveDataSymbol: "USD/CHF",
    dukascopySymbol: "USDCHF",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "usdjpy",
    label: "USD/JPY",
    twelveDataSymbol: "USD/JPY",
    dukascopySymbol: "USDJPY",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "xagusd",
    label: "XAG/USD",
    twelveDataSymbol: "XAG/USD",
    dukascopySymbol: "XAGUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
  {
    key: "usoil",
    label: "US Oil",
    twelveDataSymbol: "WTI/USD",
    dukascopySymbol: "LIGHTCMDUSD",
    enabledTimeframes: MARKET_DATA_TIMEFRAMES,
  },
];

export function findMarketDataSymbol(symbolKey: string) {
  return MARKET_DATA_SYMBOLS.find((symbol) => symbol.key === symbolKey);
}
