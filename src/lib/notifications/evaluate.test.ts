import { describe, expect, it } from "vitest";

import {
  evaluateCondition,
  evaluateStateCondition,
  extractNumericValue,
  needsPreviousValue,
} from "./evaluate";
import type { IndicatorSnapshot } from "@/data/indicators";

const snapshot = (value: string): IndicatorSnapshot => ({
  key: "xauusd-spot",
  name: "XAUUSD Spot",
  source: "test",
  cadence: "test",
  value,
  change: "0",
  status: "neutral",
  summary: "test",
  observedAt: "2026-06-11T00:00:00Z",
  observedLabel: "Jun 11",
});

describe("alert condition evaluation", () => {
  it("extracts numeric values from formatted indicator strings", () => {
    expect(extractNumericValue(snapshot("$4,321.50"))).toBe(4321.5);
    expect(extractNumericValue(snapshot("66.5%"))).toBe(66.5);
    expect(extractNumericValue(snapshot("not available"))).toBeNull();
  });

  it("extracts SMA values without treating the period as the value", () => {
    expect(
      extractNumericValue({
        ...snapshot("SMA50: $4,312 | SMA200: $4,089"),
        key: "xauusd-sma",
      }),
    ).toBe(4312);
  });

  it("evaluates threshold operators", () => {
    expect(evaluateCondition(10, { operator: "gt", value: 9 })).toBe(true);
    expect(evaluateCondition(10, { operator: "lt", value: 9 })).toBe(false);
    expect(evaluateCondition(10, { operator: "gte", value: 10 })).toBe(true);
    expect(evaluateCondition(10, { operator: "lte", value: 10 })).toBe(true);
    expect(evaluateCondition(10, { operator: "eq", value: 10 })).toBe(true);
  });

  it("evaluates range and cross operators", () => {
    expect(evaluateCondition(10, { operator: "between", min: 9, max: 11 })).toBe(true);
    expect(evaluateCondition(12, { operator: "between", min: 9, max: 11 })).toBe(false);
    expect(evaluateCondition(11, { operator: "cross_above", value: 10 }, 9)).toBe(true);
    expect(evaluateCondition(9, { operator: "cross_below", value: 10 }, 11)).toBe(true);
    expect(evaluateCondition(11, { operator: "cross_above", value: 10 })).toBe(false);
  });

  it("identifies operators that require previous values", () => {
    expect(needsPreviousValue({ operator: "cross_above", value: 10 })).toBe(true);
    expect(needsPreviousValue({ operator: "cross_below", value: 10 })).toBe(true);
    expect(needsPreviousValue({ operator: "gt", value: 10 })).toBe(false);
  });

  it("evaluates thesis and driver state monitors", () => {
    expect(
      evaluateStateCondition("supportive", {
        operator: "state_is",
        state: "supportive",
      }),
    ).toBe(true);
    expect(
      evaluateStateCondition("mixed", {
        operator: "state_is",
        state: "supportive",
      }),
    ).toBe(false);
  });
});
