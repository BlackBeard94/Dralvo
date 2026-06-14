import { describe, expect, it } from "vitest";

import {
  DRIVER_SOURCE_REGISTRY,
  IMPLEMENTED_DRIVER_SOURCE_REGISTRY,
  getImplementedDriverKeys,
} from "./driver-registry";

describe("driver source registry", () => {
  it("tracks implemented evidence drivers separately from planned drivers", () => {
    expect(getImplementedDriverKeys()).toEqual([
      "xauusd-price-context",
      "tips-real-yield",
      "cftc-gold-positioning",
      "comex-gold-inventory",
      "gld-gold-holdings",
    ]);
    expect(IMPLEMENTED_DRIVER_SOURCE_REGISTRY).toHaveLength(5);
  });

  it("requires source and methodology metadata for every driver", () => {
    for (const driver of DRIVER_SOURCE_REGISTRY) {
      expect(driver.driverKey).toBeTruthy();
      expect(driver.sourceKey).toBeTruthy();
      expect(driver.sourceUrl).toMatch(/^https:\/\//);
      expect(driver.methodologyVersion).toMatch(/\.(v|V)\d+$/);
      expect(driver.requiredSeries.length).toBeGreaterThan(0);
      expect(driver.delayedWithinMinutes).toBeGreaterThan(driver.healthyWithinMinutes);
    }
  });
});
