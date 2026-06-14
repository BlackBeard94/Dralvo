import { describe, expect, it } from "vitest";

import { summarizeDriverHistory } from "./driver-history";

describe("summarizeDriverHistory", () => {
  it("sorts observations and computes latest change and percentile", () => {
    expect(
      summarizeDriverHistory([
        { observedAt: "2025-01-14T00:00:00Z", value: 30 },
        { observedAt: "2025-01-07T00:00:00Z", value: 10 },
        { observedAt: "2025-01-21T00:00:00Z", value: 20 },
      ]),
    ).toMatchObject({
      latest: { observedAt: "2025-01-21T00:00:00Z", value: 20 },
      change: -10,
      percentile: 67,
      minimum: 10,
      maximum: 30,
    });
  });

  it("returns null metrics for empty history", () => {
    expect(summarizeDriverHistory([])).toEqual({
      latest: null,
      change: null,
      percentile: null,
      minimum: null,
      maximum: null,
    });
  });
});
