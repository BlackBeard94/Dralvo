import { describe, expect, it } from "vitest";

import { buildFreshnessReport } from "./freshness";

const now = new Date("2026-06-11T10:30:00Z");

describe("buildFreshnessReport", () => {
  it("marks fresh data and cron logs as healthy", () => {
    expect(
      buildFreshnessReport({
        now,
        latestSnapshotAt: "2026-06-11T10:20:00Z",
        runLogs: [
          {
            run_type: "alerts_evaluate",
            status: "success",
            finished_at: "2026-06-11T10:25:00Z",
          },
          {
            run_type: "indicator_ingest",
            status: "success",
            finished_at: "2026-06-11T09:30:00Z",
          },
        ],
      }),
    ).toMatchObject({
      overall: "healthy",
      alert_evaluator: { status: "healthy", age_minutes: 5 },
      ingest: { status: "healthy", age_minutes: 60 },
    });
  });

  it("checks snapshot freshness for each expected indicator", () => {
    const report = buildFreshnessReport({
      now,
      snapshots: [
        { indicator_key: "xauusd-spot", observed_at: "2026-06-11T10:20:00Z" },
        { indicator_key: "tips-yields", observed_at: "2026-06-09T09:00:00Z" },
      ],
      expectedIndicators: ["xauusd-spot", "tips-yields", "xauusd-rsi"],
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "success",
          finished_at: "2026-06-11T09:30:00Z",
        },
      ],
    });

    expect(report.data_snapshots).toMatchObject({
      status: "unknown",
      stale_keys: ["tips-yields"],
      missing_keys: ["xauusd-rsi"],
    });
    expect(report.overall).toBe("unknown");
  });

  it("uses per-indicator freshness windows for weekly and daily sources", () => {
    const report = buildFreshnessReport({
      now,
      snapshots: [
        {
          indicator_key: "cftc-gold-positioning",
          observed_at: "2026-06-02T00:00:00Z",
        },
        {
          indicator_key: "comex-gold-inventory",
          observed_at: "2026-06-09T00:00:00Z",
        },
      ],
      snapshotExpectations: [
        {
          indicatorKey: "cftc-gold-positioning",
          healthyWithinMinutes: 10 * 24 * 60,
          delayedWithinMinutes: 14 * 24 * 60,
        },
        {
          indicatorKey: "comex-gold-inventory",
          healthyWithinMinutes: 2 * 24 * 60,
          delayedWithinMinutes: 4 * 24 * 60,
        },
      ],
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "success",
          finished_at: "2026-06-11T09:30:00Z",
        },
      ],
    });

    expect(report.data_snapshots).toMatchObject({
      status: "delayed",
      stale_keys: ["comex-gold-inventory"],
      missing_keys: [],
    });
    expect(report.overall).toBe("delayed");
  });

  it("marks stale alert evaluation as failed", () => {
    expect(
      buildFreshnessReport({
        now,
        latestSnapshotAt: "2026-06-11T10:20:00Z",
        runLogs: [
          {
            run_type: "alerts_evaluate",
            status: "success",
            finished_at: "2026-06-11T09:45:00Z",
          },
          {
            run_type: "indicator_ingest",
            status: "success",
            finished_at: "2026-06-11T09:30:00Z",
          },
        ],
      }).alert_evaluator,
    ).toMatchObject({ status: "failed", age_minutes: 45 });
  });

  it("marks errored jobs as failed even when recent", () => {
    const report = buildFreshnessReport({
      now,
      latestSnapshotAt: "2026-06-11T10:20:00Z",
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "error",
          finished_at: "2026-06-11T10:28:00Z",
          error: "xauusd-sma: upstream timeout",
        },
      ],
    });

    expect(report.overall).toBe("failed");
    expect(report.ingest).toMatchObject({
      status: "failed",
      last_error: "xauusd-sma: upstream timeout",
    });
  });

  it("marks partial ingest as delayed when stored snapshots are still fresh", () => {
    const report = buildFreshnessReport({
      now,
      latestSnapshotAt: "2026-06-11T10:29:00Z",
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "error",
          finished_at: "2026-06-11T10:28:00Z",
          error: "xauusd-sma: 429",
          metadata: {
            partial: true,
          },
        },
      ],
    });

    expect(report.overall).toBe("delayed");
    expect(report.ingest).toMatchObject({
      status: "delayed",
      last_error: "xauusd-sma: 429",
    });
  });

  it("marks upstream rate limit as delayed when stored snapshots are still fresh", () => {
    const report = buildFreshnessReport({
      now,
      latestSnapshotAt: "2026-06-11T10:29:00Z",
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "error",
          finished_at: "2026-06-11T10:28:00Z",
          error: "xauusd-spot: Twelve Data returned 429",
        },
      ],
    });

    expect(report.overall).toBe("delayed");
    expect(report.ingest).toMatchObject({
      status: "delayed",
      last_error: "xauusd-spot: Twelve Data returned 429",
    });
  });

  it("checks evidence freshness by required driver series", () => {
    const report = buildFreshnessReport({
      now,
      latestSnapshotAt: "2026-06-11T10:20:00Z",
      evidenceObservations: [
        {
          driver_key: "cftc-gold-positioning",
          series_key: "open_interest",
          observed_at: "2026-06-02T00:00:00Z",
        },
        {
          driver_key: "cftc-gold-positioning",
          series_key: "managed_money_net",
          observed_at: "2026-06-02T00:00:00Z",
        },
      ],
      expectedEvidenceDrivers: [
        {
          driverKey: "cftc-gold-positioning",
          requiredSeries: ["open_interest", "managed_money_net", "swap_dealer_net"],
          healthyWithinMinutes: 10 * 24 * 60,
          delayedWithinMinutes: 14 * 24 * 60,
          methodologyVersion: "cftc-gold-positioning.v1",
          sourceUrl: "https://www.cftc.gov/dea/newcot/f_disagg.txt",
        },
      ],
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "success",
          finished_at: "2026-06-11T09:30:00Z",
        },
      ],
    });

    expect(report.evidence_sources).toMatchObject({
      status: "unknown",
      drivers: {
        "cftc-gold-positioning": {
          status: "unknown",
          missing_series: ["swap_dealer_net"],
          methodology_version: "cftc-gold-positioning.v1",
        },
      },
    });
    expect(report.overall).toBe("unknown");
  });

  it("marks evidence driver as delayed after healthy window but before failure window", () => {
    const report = buildFreshnessReport({
      now,
      latestSnapshotAt: "2026-06-11T10:20:00Z",
      evidenceObservations: [
        {
          driver_key: "cftc-gold-positioning",
          series_key: "open_interest",
          observed_at: "2026-06-01T00:00:00Z",
        },
      ],
      expectedEvidenceDrivers: [
        {
          driverKey: "cftc-gold-positioning",
          requiredSeries: ["open_interest"],
          healthyWithinMinutes: 10 * 24 * 60,
          delayedWithinMinutes: 14 * 24 * 60,
          methodologyVersion: "cftc-gold-positioning.v1",
          sourceUrl: "https://www.cftc.gov/dea/newcot/f_disagg.txt",
        },
      ],
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "success",
          finished_at: "2026-06-11T09:30:00Z",
        },
      ],
    });

    expect(report.evidence_sources.drivers["cftc-gold-positioning"]).toMatchObject({
      status: "delayed",
      stale_series: ["open_interest"],
    });
    expect(report.overall).toBe("delayed");
  });

  it("keeps optional legacy snapshots observable without failing evidence-based health", () => {
    const report = buildFreshnessReport({
      now,
      snapshots: [
        {
          indicator_key: "xauusd-rsi",
          observed_at: "2026-06-01T00:00:00Z",
        },
      ],
      snapshotExpectations: [
        {
          indicatorKey: "xauusd-rsi",
          healthyWithinMinutes: 60,
          delayedWithinMinutes: 120,
        },
      ],
      evidenceObservations: [
        {
          driver_key: "xauusd-price-context",
          series_key: "xauusd_close",
          observed_at: "2026-06-11T10:20:00Z",
        },
      ],
      expectedEvidenceDrivers: [
        {
          driverKey: "xauusd-price-context",
          requiredSeries: ["xauusd_close"],
          healthyWithinMinutes: 24 * 60,
          delayedWithinMinutes: 48 * 60,
          methodologyVersion: "xauusd-price-context.v1",
          sourceUrl: "https://twelvedata.com/docs",
        },
      ],
      runLogs: [
        {
          run_type: "alerts_evaluate",
          status: "success",
          finished_at: "2026-06-11T10:25:00Z",
        },
        {
          run_type: "indicator_ingest",
          status: "success",
          finished_at: "2026-06-11T09:30:00Z",
        },
      ],
    });

    expect(report.data_snapshots).toMatchObject({
      status: "failed",
      stale_keys: ["xauusd-rsi"],
    });
    expect(report.evidence_sources.status).toBe("healthy");
    expect(report.overall).toBe("healthy");
  });
});
