import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";

export type ThesisState =
  | "supportive"
  | "mixed"
  | "adverse"
  | "insufficient_data";

export type EvidenceRow = {
  driver_key: string;
  series_key: string;
  numeric_value: number;
  unit: string;
  observed_at: string;
  source_url: string;
  quality: string;
};

export type ThesisDriverState = {
  driverKey: string;
  label: string;
  state: "supportive" | "neutral" | "adverse" | "missing" | "stale";
  score: -1 | 0 | 1;
  observedAt: string | null;
  sourceUrl: string;
  evidence: string;
  rule: string;
};

export type PriceRelationshipInsight = {
  state: "confirming" | "diverging" | "neutral" | "insufficient_data";
  priceDirection: "supportive" | "adverse" | "neutral" | "unavailable";
  fundamentalDirection:
    | "supportive"
    | "adverse"
    | "mixed"
    | "insufficient_data";
  title: string;
  summary: string;
};

export type GoldThesis = {
  state: ThesisState;
  title: string;
  summary: string;
  generatedAt: string;
  methodologyVersion: "gold-thesis.v1" | "gold-thesis.v2";
  coverage: {
    available: number;
    required: number;
    stale: number;
    missing: number;
  };
  drivers: ThesisDriverState[];
  supportingDrivers: ThesisDriverState[];
  contradictingDrivers: ThesisDriverState[];
  neutralDrivers: ThesisDriverState[];
  staleDrivers: ThesisDriverState[];
  missingDrivers: ThesisDriverState[];
  priceRelationship?: PriceRelationshipInsight;
  changeConditions: string[];
};

type SeriesPoint = {
  value: number;
  unit: string;
  observedAt: string;
  sourceUrl: string;
};

const REQUIRED_DRIVERS = [
  "xauusd-price-context",
  "tips-real-yield",
  "cftc-gold-positioning",
  "comex-gold-inventory",
  "gld-gold-holdings",
] as const;

function latestSeries(rows: EvidenceRow[]) {
  const map = new Map<string, SeriesPoint[]>();

  for (const row of rows) {
    if (!Number.isFinite(row.numeric_value)) continue;
    const key = `${row.driver_key}:${row.series_key}`;
    const points = map.get(key) ?? [];
    points.push({
      value: row.numeric_value,
      unit: row.unit,
      observedAt: row.observed_at,
      sourceUrl: row.source_url,
    });
    map.set(key, points);
  }

  for (const points of map.values()) {
    points.sort(
      (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt),
    );
  }

  return map;
}

function point(
  series: Map<string, SeriesPoint[]>,
  driverKey: string,
  seriesKey: string,
  index = 0,
) {
  return series.get(`${driverKey}:${seriesKey}`)?.[index] ?? null;
}

function config(driverKey: string) {
  return DRIVER_SOURCE_REGISTRY.find((driver) => driver.driverKey === driverKey);
}

function isStale(driverKey: string, observedAt: string, now: Date) {
  const driver = config(driverKey);
  if (!driver) return true;
  const ageMinutes = (now.getTime() - Date.parse(observedAt)) / 60_000;
  return !Number.isFinite(ageMinutes) || ageMinutes > driver.delayedWithinMinutes;
}

function missingDriver(driverKey: string): ThesisDriverState {
  const driver = config(driverKey);
  return {
    driverKey,
    label: driver?.label ?? driverKey,
    state: "missing",
    score: 0,
    observedAt: null,
    sourceUrl: driver?.sourceUrl ?? "",
    evidence: "Required source observation is not available.",
    rule: "A thesis cannot infer a value for a missing source.",
  };
}

function staleState(state: ThesisDriverState, now: Date): ThesisDriverState {
  if (!state.observedAt || !isStale(state.driverKey, state.observedAt, now)) {
    return state;
  }
  return {
    ...state,
    state: "stale",
    score: 0,
    evidence: `${state.evidence} The observation is beyond the configured freshness window.`,
  };
}

function xauusdState(
  series: Map<string, SeriesPoint[]>,
): ThesisDriverState | null {
  const change = point(
    series,
    "xauusd-price-context",
    "xauusd_daily_change_percent",
  );
  const close = point(series, "xauusd-price-context", "xauusd_close_usd");
  if (!change || !close) return null;

  const score: -1 | 0 | 1 =
    change.value >= 0.3 ? 1 : change.value <= -0.3 ? -1 : 0;
  return {
    driverKey: "xauusd-price-context",
    label: "XAUUSD Price Context",
    state: score > 0 ? "supportive" : score < 0 ? "adverse" : "neutral",
    score,
    observedAt: change.observedAt,
    sourceUrl: change.sourceUrl,
    evidence: `XAUUSD closed at $${close.value.toFixed(2)} with a ${change.value >= 0 ? "+" : ""}${change.value.toFixed(2)}% daily change.`,
    rule: "Daily change >= +0.30% is supportive context; <= -0.30% is adverse context.",
  };
}

function tipsState(series: Map<string, SeriesPoint[]>): ThesisDriverState | null {
  const yieldPoint = point(
    series,
    "tips-real-yield",
    "dfii10_yield_percent",
  );
  const change = point(series, "tips-real-yield", "dfii10_change_bps");
  if (!yieldPoint || !change) return null;

  const score: -1 | 0 | 1 =
    change.value <= -2 ? 1 : change.value >= 2 ? -1 : 0;
  return {
    driverKey: "tips-real-yield",
    label: "10Y TIPS Real Yield",
    state: score > 0 ? "supportive" : score < 0 ? "adverse" : "neutral",
    score,
    observedAt: change.observedAt,
    sourceUrl: change.sourceUrl,
    evidence: `The 10Y real yield is ${yieldPoint.value.toFixed(2)}%, changing ${change.value >= 0 ? "+" : ""}${change.value.toFixed(0)} bps.`,
    rule: "A fall of at least 2 bps supports gold; a rise of at least 2 bps is adverse.",
  };
}

function cftcState(series: Map<string, SeriesPoint[]>): ThesisDriverState | null {
  const latest = point(
    series,
    "cftc-gold-positioning",
    "managed_money_net",
  );
  const previous = point(
    series,
    "cftc-gold-positioning",
    "managed_money_net",
    1,
  );
  if (!latest || !previous) return null;

  const change = latest.value - previous.value;
  const threshold = Math.max(Math.abs(previous.value) * 0.03, 5_000);
  const score: -1 | 0 | 1 =
    change >= threshold ? 1 : change <= -threshold ? -1 : 0;
  return {
    driverKey: "cftc-gold-positioning",
    label: "CFTC Gold Positioning",
    state: score > 0 ? "supportive" : score < 0 ? "adverse" : "neutral",
    score,
    observedAt: latest.observedAt,
    sourceUrl: latest.sourceUrl,
    evidence: `Managed Money net positioning changed ${change >= 0 ? "+" : ""}${Math.round(change).toLocaleString("en-US")} contracts from the prior report.`,
    rule: "A weekly change exceeding 3% of the prior net position or 5,000 contracts is material.",
  };
}

function comexState(series: Map<string, SeriesPoint[]>): ThesisDriverState | null {
  const registered = point(
    series,
    "comex-gold-inventory",
    "registered_ounces",
  );
  const change = point(
    series,
    "comex-gold-inventory",
    "registered_net_change_ounces",
  );
  if (!registered || !change) return null;

  const material = Math.max(registered.value * 0.005, 50_000);
  const score: -1 | 0 | 1 =
    change.value <= -material ? 1 : change.value >= material ? -1 : 0;
  return {
    driverKey: "comex-gold-inventory",
    label: "COMEX Gold Inventory",
    state: score > 0 ? "supportive" : score < 0 ? "adverse" : "neutral",
    score,
    observedAt: registered.observedAt,
    sourceUrl: registered.sourceUrl,
    evidence: `Registered stocks are ${Math.round(registered.value).toLocaleString("en-US")} oz with a ${change.value >= 0 ? "+" : ""}${Math.round(change.value).toLocaleString("en-US")} oz reported change.`,
    rule: "A registered-stock move above 0.5% or 50,000 oz is treated as material; draws support scarcity context.",
  };
}

function gldState(series: Map<string, SeriesPoint[]>): ThesisDriverState | null {
  const tonnes = point(series, "gld-gold-holdings", "gld_tonnes");
  const change = point(
    series,
    "gld-gold-holdings",
    "gld_holdings_change_tonnes",
  );
  if (!tonnes || !change) return null;

  const score: -1 | 0 | 1 =
    change.value >= 0.5 ? 1 : change.value <= -0.5 ? -1 : 0;
  return {
    driverKey: "gld-gold-holdings",
    label: "GLD Gold Holdings",
    state: score > 0 ? "supportive" : score < 0 ? "adverse" : "neutral",
    score,
    observedAt: tonnes.observedAt,
    sourceUrl: tonnes.sourceUrl,
    evidence: `GLD holds ${tonnes.value.toFixed(2)} tonnes, changing ${change.value >= 0 ? "+" : ""}${change.value.toFixed(2)} tonnes from the prior issuer observation.`,
    rule: "A holdings change of at least 0.5 tonnes is treated as material.",
  };
}

function thesisTitle(state: ThesisState) {
  switch (state) {
    case "supportive":
      return "Gold evidence is broadly supportive";
    case "adverse":
      return "Gold evidence is broadly adverse";
    case "mixed":
      return "Gold evidence is mixed";
    default:
      return "Not enough verified evidence";
  }
}

function buildPriceRelationship(
  price: ThesisDriverState | undefined,
  fundamentals: ThesisDriverState[],
  fundamentalScore: number,
): PriceRelationshipInsight {
  if (
    !price ||
    price.state === "missing" ||
    price.state === "stale" ||
    fundamentals.length < 3
  ) {
    return {
      state: "insufficient_data",
      priceDirection: "unavailable",
      fundamentalDirection: "insufficient_data",
      title: "Price relationship is unavailable",
      summary:
        "Dralvo needs usable price context and at least three fundamental driver groups before comparing their direction.",
    };
  }

  const priceDirection =
    price.score > 0 ? "supportive" : price.score < 0 ? "adverse" : "neutral";
  const fundamentalDirection =
    fundamentalScore >= 2
      ? "supportive"
      : fundamentalScore <= -2
        ? "adverse"
        : "mixed";

  if (priceDirection === "neutral" || fundamentalDirection === "mixed") {
    return {
      state: "neutral",
      priceDirection,
      fundamentalDirection,
      title: "No directional price relationship",
      summary:
        "Price or the fundamental evidence balance is not directional enough to classify confirmation or divergence.",
    };
  }

  if (priceDirection === fundamentalDirection) {
    return {
      state: "confirming",
      priceDirection,
      fundamentalDirection,
      title: "Price confirms the fundamental balance",
      summary:
        "XAUUSD daily direction and the current balance of fundamental drivers point the same way. This is context, not a forecast.",
    };
  }

  return {
    state: "diverging",
    priceDirection,
    fundamentalDirection,
    title: "Price diverges from the fundamental balance",
    summary:
      "XAUUSD daily direction is moving against the current balance of fundamental drivers. Dralvo flags the disagreement without assuming how it will resolve.",
  };
}

export function buildGoldThesis(
  rows: EvidenceRow[],
  now = new Date(),
): GoldThesis {
  const series = latestSeries(rows);
  const builders = new Map<string, () => ThesisDriverState | null>([
    ["xauusd-price-context", () => xauusdState(series)],
    ["tips-real-yield", () => tipsState(series)],
    ["cftc-gold-positioning", () => cftcState(series)],
    ["comex-gold-inventory", () => comexState(series)],
    ["gld-gold-holdings", () => gldState(series)],
  ]);

  const drivers = REQUIRED_DRIVERS.map((driverKey) => {
    const state = builders.get(driverKey)?.() ?? null;
    return state ? staleState(state, now) : missingDriver(driverKey);
  });
  const available = drivers.filter(
    (driver) => driver.state !== "missing" && driver.state !== "stale",
  );
  const fundamentals = available.filter(
    (driver) => driver.driverKey !== "xauusd-price-context",
  );
  const priceAvailable = available.some(
    (driver) => driver.driverKey === "xauusd-price-context",
  );
  const fundamentalScore = fundamentals.reduce(
    (total, driver) => total + driver.score,
    0,
  );
  const priceRelationship = buildPriceRelationship(
    available.find((driver) => driver.driverKey === "xauusd-price-context"),
    fundamentals,
    fundamentalScore,
  );

  let state: ThesisState;
  if (!priceAvailable || fundamentals.length < 3) {
    state = "insufficient_data";
  } else if (fundamentalScore >= 2) {
    state = "supportive";
  } else if (fundamentalScore <= -2) {
    state = "adverse";
  } else {
    state = "mixed";
  }

  const supportingDrivers = drivers.filter(
    (driver) => driver.state === "supportive",
  );
  const contradictingDrivers = drivers.filter(
    (driver) => driver.state === "adverse",
  );
  const neutralDrivers = drivers.filter((driver) => driver.state === "neutral");
  const staleDrivers = drivers.filter((driver) => driver.state === "stale");
  const missingDrivers = drivers.filter((driver) => driver.state === "missing");

  const summary =
    state === "insufficient_data"
      ? `Only ${fundamentals.length} of 4 fundamental driver groups are currently usable alongside price context.`
      : `${supportingDrivers.length} drivers are supportive, ${contradictingDrivers.length} are adverse, and ${neutralDrivers.length} are neutral.`;

  return {
    state,
    title: thesisTitle(state),
    summary,
    generatedAt: now.toISOString(),
    methodologyVersion: "gold-thesis.v2",
    coverage: {
      available: available.length,
      required: REQUIRED_DRIVERS.length,
      stale: staleDrivers.length,
      missing: missingDrivers.length,
    },
    drivers,
    supportingDrivers,
    contradictingDrivers,
    neutralDrivers,
    staleDrivers,
    missingDrivers,
    priceRelationship,
    changeConditions: [
      "A material reversal in 10Y real-yield direction.",
      "A material weekly change in Managed Money net positioning.",
      "A material COMEX registered-stock build or draw.",
      "A GLD holdings change of at least 0.5 tonnes.",
      "Price context diverging from the fundamental driver balance.",
    ],
  };
}
