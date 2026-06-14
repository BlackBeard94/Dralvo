export type DriverImplementationStatus = "implemented" | "planned" | "deferred";

export type DriverSourceConfig = {
  driverKey: string;
  label: string;
  sourceKey: string;
  sourceUrl: string;
  cadence: string;
  cadenceMinutes: number;
  healthyWithinMinutes: number;
  delayedWithinMinutes: number;
  methodologyVersion: string;
  requiredSeries: string[];
  status: DriverImplementationStatus;
  notes: string;
  decisionQuestion: string;
  relationship: string;
  limitations: string;
};

export const DRIVER_SOURCE_REGISTRY = [
  {
    driverKey: "xauusd-price-context",
    label: "XAUUSD Price Context",
    sourceKey: "twelve-data",
    sourceUrl: "https://twelvedata.com/docs",
    cadence: "Hourly ingestion from daily market bars",
    cadenceMinutes: 60,
    healthyWithinMinutes: 2 * 24 * 60,
    delayedWithinMinutes: 4 * 24 * 60,
    methodologyVersion: "xauusd-price-context.v1",
    requiredSeries: ["xauusd_close_usd", "xauusd_daily_change_percent"],
    status: "implemented",
    notes:
      "One Twelve Data time-series request returns the latest two daily XAU/USD closes; no fabricated change values.",
    decisionQuestion: "Is price confirming or rejecting the current evidence balance?",
    relationship:
      "Daily price change is confirmation context only. It does not determine the fundamental thesis.",
    limitations:
      "One provider and one daily comparison cannot represent execution quality, intraday structure, spreads, or liquidity.",
  },
  {
    driverKey: "tips-real-yield",
    label: "10Y TIPS Real Yield",
    sourceKey: "fred-dfii10",
    sourceUrl: "https://fred.stlouisfed.org/series/DFII10",
    cadence: "Daily on FRED publication days",
    cadenceMinutes: 24 * 60,
    healthyWithinMinutes: 3 * 24 * 60,
    delayedWithinMinutes: 5 * 24 * 60,
    methodologyVersion: "tips-real-yield.v1",
    requiredSeries: ["dfii10_yield_percent", "dfii10_change_bps"],
    status: "implemented",
    notes:
      "Official FRED DFII10 series using the latest two valid observations; missing values never become estimates.",
    decisionQuestion: "Is the real opportunity cost of holding gold rising or falling?",
    relationship:
      "Falling real yields generally reduce the opportunity cost of holding non-yielding gold; rising real yields generally increase it.",
    limitations:
      "The relationship is not stable at every horizon and may be overwhelmed by inflation shocks, risk demand, currencies, or positioning.",
  },
  {
    driverKey: "cftc-gold-positioning",
    label: "CFTC Gold Positioning",
    sourceKey: "cftc-disaggregated-futures",
    sourceUrl: "https://www.cftc.gov/dea/newcot/f_disagg.txt",
    cadence: "Weekly, generally Friday, reporting Tuesday positions",
    cadenceMinutes: 7 * 24 * 60,
    healthyWithinMinutes: 10 * 24 * 60,
    delayedWithinMinutes: 14 * 24 * 60,
    methodologyVersion: "cftc-gold-positioning.v1",
    requiredSeries: [
      "open_interest",
      "producer_merchant_net",
      "swap_dealer_net",
      "managed_money_net",
    ],
    status: "implemented",
    notes:
      "Official CFTC disaggregated futures-only report for Gold COMEX contract 088691.",
    decisionQuestion: "Are speculative futures positions accumulating or reducing gold exposure?",
    relationship:
      "A material weekly increase in Managed Money net positioning supports demand context; a material decrease is adverse context.",
    limitations:
      "The report is weekly, published with a lag, futures-only, and cannot identify individual motives or predict turning points by itself.",
  },
  {
    driverKey: "comex-gold-inventory",
    label: "COMEX Gold Inventory",
    sourceKey: "cme-delivery-reports",
    sourceUrl: "https://www.cmegroup.com/clearing/operations-and-deliveries/registrar-reports.html",
    cadence: "Daily on CME business days",
    cadenceMinutes: 24 * 60,
    healthyWithinMinutes: 2 * 24 * 60,
    delayedWithinMinutes: 4 * 24 * 60,
    methodologyVersion: "comex-gold-inventory.v1",
    requiredSeries: ["registered_ounces", "eligible_ounces"],
    status: "implemented",
    notes: "Official CME Daily Metal Stocks Report totals for registered and eligible gold stocks.",
    decisionQuestion: "Is readily deliverable exchange inventory materially expanding or contracting?",
    relationship:
      "A material registered-stock draw can support scarcity context; a material build can reduce it.",
    limitations:
      "Warehouse category transfers are not the same as physical consumption, and COMEX stocks represent only part of the global gold market.",
  },
  {
    driverKey: "gld-gold-holdings",
    label: "GLD Gold Holdings",
    sourceKey: "spdr-gold-shares",
    sourceUrl:
      "https://api.spdrgoldshares.com/api/v1/historical-archive?product=gld&exchange=NYSE&lang=en",
    cadence: "Daily on issuer publication days",
    cadenceMinutes: 24 * 60,
    healthyWithinMinutes: 2 * 24 * 60,
    delayedWithinMinutes: 4 * 24 * 60,
    methodologyVersion: "gld-gold-holdings.v1",
    requiredSeries: ["gld_tonnes", "gld_holdings_change_tonnes"],
    status: "implemented",
    notes:
      "Official SPDR Gold Shares historical archive. Daily holdings change is derived from consecutive issuer observations and is not labelled as capital flow.",
    decisionQuestion: "Is the largest physically backed gold ETF adding or reducing reported metal holdings?",
    relationship:
      "Material holdings increases support institutional demand context; decreases are adverse demand context.",
    limitations:
      "Holdings change is not identical to cash flow, covers GLD rather than the entire ETF universe, and follows issuer publication timing.",
  },
] as const satisfies DriverSourceConfig[];

export const IMPLEMENTED_DRIVER_SOURCE_REGISTRY = DRIVER_SOURCE_REGISTRY.filter(
  (driver) => driver.status === "implemented",
);

export function getImplementedDriverKeys() {
  return IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => driver.driverKey);
}
