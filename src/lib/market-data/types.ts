export type MarketDataProvider = "twelve-data" | "dukascopy-csv" | "static-cache";

export type MarketDataTimeframe =
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "1h"
  | "4h"
  | "1day";

export type MarketDataSymbol = {
  key: string;
  label: string;
  twelveDataSymbol: string;
  dukascopySymbol: string;
  enabledTimeframes: MarketDataTimeframe[];
};

export type MarketCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  spread: number | null;
};

export type MarketDatasetManifestItem = {
  symbol: string;
  timeframe: MarketDataTimeframe;
  provider: MarketDataProvider;
  path: string;
  candles: number;
  firstTime: string | null;
  lastTime: string | null;
  generatedAt: string;
};

export type MarketDatasetManifest = {
  version: 1;
  generatedAt: string;
  datasets: MarketDatasetManifestItem[];
};
