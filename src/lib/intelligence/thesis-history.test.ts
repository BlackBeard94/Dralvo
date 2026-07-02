import { describe, expect, it } from "vitest";

import type { GoldThesis, ThesisState } from "@/lib/intelligence/gold-thesis";
import {
  buildThesisTimeline,
  type StoredThesisSnapshot,
} from "@/lib/intelligence/thesis-history";

function thesis(
  state: ThesisState,
  generatedAt: string,
  tipsState: GoldThesis["drivers"][number]["state"],
  relationshipState: NonNullable<
    GoldThesis["priceRelationship"]
  >["state"] = "neutral",
): GoldThesis {
  const driver = {
    driverKey: "tips-real-yield",
    label: "10Y TIPS Real Yield",
    state: tipsState,
    score: tipsState === "supportive" ? (1 as const) : (0 as const),
    observedAt: generatedAt,
    sourceUrl: "https://example.com",
    evidence: "Evidence",
    rule: "Rule",
  };

  return {
    state,
    title: `${state} title`,
    summary: `${state} summary`,
    generatedAt,
    methodologyVersion: "gold-thesis.v2",
    coverage: { available: 1, required: 1, stale: 0, missing: 0 },
    drivers: [driver],
    supportingDrivers: tipsState === "supportive" ? [driver] : [],
    contradictingDrivers: [],
    neutralDrivers: tipsState === "neutral" ? [driver] : [],
    staleDrivers: [],
    missingDrivers: [],
    priceRelationship: {
      state: relationshipState,
      priceDirection: "neutral",
      fundamentalDirection: "mixed",
      title: "Relationship",
      summary: "Relationship summary",
    },
    tradeSimulation: {
      action: "stand_aside",
      bias: "neutral",
      confidence: "low",
      priceBasis: null,
      entryZone: null,
      stopLoss: null,
      takeProfit: null,
      invalidation: null,
      title: "Stand aside",
      summary: "No simulated trade",
      rationale: [],
    },
    changeConditions: [],
  };
}

function snapshot(
  date: string,
  state: ThesisState,
  tipsState: GoldThesis["drivers"][number]["state"],
  relationshipState: NonNullable<
    GoldThesis["priceRelationship"]
  >["state"] = "neutral",
): StoredThesisSnapshot {
  const generatedAt = `${date}T00:10:00.000Z`;
  return {
    thesis_date: date,
    state,
    thesis_json: thesis(state, generatedAt, tipsState, relationshipState),
    methodology_version: "gold-thesis.v2",
    generated_at: generatedAt,
  };
}

describe("buildThesisTimeline", () => {
  it("sorts newest first and records thesis and driver changes", () => {
    const result = buildThesisTimeline([
      snapshot("2026-06-10", "mixed", "neutral"),
      snapshot("2026-06-11", "supportive", "supportive", "confirming"),
    ]);

    expect(result[0]).toMatchObject({
      thesisDate: "2026-06-11",
      state: "supportive",
      previousState: "mixed",
      stateChanged: true,
      isInitial: false,
    });
    expect(result[0].driverChanges).toEqual([
      {
        driverKey: "tips-real-yield",
        label: "10Y TIPS Real Yield",
        from: "neutral",
        to: "supportive",
      },
    ]);
    expect(result[0].priceRelationshipChange).toEqual({
      from: "neutral",
      to: "confirming",
    });
  });

  it("marks the oldest snapshot as the initial record", () => {
    const result = buildThesisTimeline([
      snapshot("2026-06-10", "mixed", "neutral"),
    ]);

    expect(result[0]).toMatchObject({
      stateChanged: false,
      isInitial: true,
      previousState: null,
      driverChanges: [],
      priceRelationshipChange: null,
    });
  });
});
