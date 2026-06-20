import { describe, expect, it } from "vitest";

import {
  buildSampleCandles,
  parseStrategyPrompt,
  runStrategyBacktest,
} from "./strategy-lab";

describe("strategy lab", () => {
  it("parses EMA crossover prompts into a safe strategy spec", () => {
    const spec = parseStrategyPrompt(
      "Buy when EMA 12 crosses above EMA 36. SL 1.2 ATR, TP 2.4 ATR, risk 0.5%",
    );

    expect(spec.template).toBe("ema-cross");
    expect(spec.direction).toBe("long");
    expect(spec.fastEma).toBe(12);
    expect(spec.slowEma).toBe(36);
    expect(spec.stopAtr).toBe(1.2);
    expect(spec.targetAtr).toBe(2.4);
    expect(spec.riskPct).toBe(0.5);
  });

  it("parses RSI prompts into mean reversion rules", () => {
    const spec = parseStrategyPrompt("RSI buy below 30 and sell above 70");

    expect(spec.template).toBe("rsi-reversion");
    expect(spec.rsiBuyBelow).toBe(30);
    expect(spec.rsiSellAbove).toBe(70);
  });

  it("does not classify tiny samples as edge candidates", () => {
    const candles = buildSampleCandles("xauusd", "1h", 160);
    const spec = parseStrategyPrompt("Buy when EMA 20 crosses above EMA 50");
    const result = runStrategyBacktest(candles, spec);

    expect(result.totalTrades).toBeLessThan(30);
    expect(result.edgeVerdict).toBe("insufficient");
    expect(result.edgeScore).toBeLessThanOrEqual(40);
  });
});
