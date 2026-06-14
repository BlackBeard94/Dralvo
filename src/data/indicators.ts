export type IndicatorStatus = "bullish" | "neutral" | "bearish";
export type IndicatorDataQuality = "live" | "delayed" | "estimated" | "simulated";

export type IndicatorHistoryPoint = {
  observedAt: string;
  value: number;
};

export type IndicatorSnapshot = {
  key: string;
  name: string;
  source: string;
  cadence: string;
  value: string;
  change: string;
  status: IndicatorStatus;
  summary: string;
  observedAt: string;
  observedLabel: string;
  dataQuality?: IndicatorDataQuality;
  qualityNote?: string;
  /** Time-series array for sparkline charts (up to 30 data points, oldest first). */
  sparkline?: number[];
};

export type CandleOHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
};
