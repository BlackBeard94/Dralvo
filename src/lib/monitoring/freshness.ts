type FreshnessStatus = "healthy" | "delayed" | "failed" | "unknown";

type RunLog = {
  run_type: string;
  status: "success" | "error";
  finished_at: string;
  error?: string | null;
  metadata?: {
    partial?: boolean;
  } | null;
};

type SnapshotRow = {
  indicator_key: string;
  observed_at: string;
};

type EvidenceObservationRow = {
  driver_key: string;
  series_key: string;
  observed_at: string;
};

export type SnapshotFreshnessExpectation = {
  indicatorKey: string;
  healthyWithinMinutes: number;
  delayedWithinMinutes: number;
};

export type EvidenceDriverExpectation = {
  driverKey: string;
  requiredSeries: string[];
  healthyWithinMinutes: number;
  delayedWithinMinutes: number;
  methodologyVersion: string;
  sourceUrl: string;
};

export type FreshnessReport = {
  data_snapshots: {
    status: FreshnessStatus;
    age_minutes: number | null;
    stale_keys: string[];
    missing_keys: string[];
  };
  alert_evaluator: {
    status: FreshnessStatus;
    age_minutes: number | null;
    last_error: string | null;
  };
  ingest: {
    status: FreshnessStatus;
    age_minutes: number | null;
    last_error: string | null;
  };
  evidence_sources: {
    status: FreshnessStatus;
    drivers: Record<
      string,
      {
        status: FreshnessStatus;
        age_minutes: number | null;
        stale_series: string[];
        missing_series: string[];
        methodology_version: string;
        source_url: string;
      }
    >;
  };
  overall: FreshnessStatus;
};

function ageMinutes(value: string | null | undefined, nowMs: number) {
  if (!value) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((nowMs - time) / 60_000));
}

function statusFromAge(
  age: number | null,
  healthyMinutes: number,
  delayedMinutes: number,
): FreshnessStatus {
  if (age === null) return "unknown";
  if (age <= healthyMinutes) return "healthy";
  if (age <= delayedMinutes) return "delayed";
  return "failed";
}

function worstStatus(statuses: FreshnessStatus[]): FreshnessStatus {
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("unknown")) return "unknown";
  if (statuses.includes("delayed")) return "delayed";
  return "healthy";
}

function latestRunLog(logs: RunLog[], runType: string) {
  return logs.find((log) => log.run_type === runType) ?? null;
}

function buildSnapshotStatus({
  latestSnapshotAt,
  snapshots,
  expectedIndicators,
  snapshotExpectations,
  nowMs,
}: {
  latestSnapshotAt?: string | null;
  snapshots?: SnapshotRow[];
  expectedIndicators?: string[];
  snapshotExpectations?: SnapshotFreshnessExpectation[];
  nowMs: number;
}) {
  const expectations = snapshotExpectations?.length
    ? snapshotExpectations
    : expectedIndicators?.map((indicatorKey) => ({
        indicatorKey,
        healthyWithinMinutes: 24 * 60,
        delayedWithinMinutes: 48 * 60,
      }));

  if (!snapshots || !expectations || expectations.length === 0) {
    const age = ageMinutes(latestSnapshotAt, nowMs);
    return {
      status: statusFromAge(age, 24 * 60, 48 * 60),
      age_minutes: age,
      stale_keys: [],
      missing_keys: [],
    };
  }

  const latestByKey = new Map<string, string>();

  for (const snapshot of snapshots) {
    const existing = latestByKey.get(snapshot.indicator_key);
    if (!existing || Date.parse(snapshot.observed_at) > Date.parse(existing)) {
      latestByKey.set(snapshot.indicator_key, snapshot.observed_at);
    }
  }

  const missingKeys = expectations
    .filter(({ indicatorKey }) => !latestByKey.has(indicatorKey))
    .map(({ indicatorKey }) => indicatorKey);
  const ages = expectations
    .map(({ indicatorKey }) => ageMinutes(latestByKey.get(indicatorKey), nowMs))
    .filter((age): age is number => age !== null);
  const worstAge = ages.length > 0 ? Math.max(...ages) : null;
  const snapshotStatuses = expectations.map((expectation) => {
    const age = ageMinutes(latestByKey.get(expectation.indicatorKey), nowMs);
    return statusFromAge(
      age,
      expectation.healthyWithinMinutes,
      expectation.delayedWithinMinutes,
    );
  });
  const staleKeys = expectations
    .filter((expectation) => {
      const age = ageMinutes(latestByKey.get(expectation.indicatorKey), nowMs);
      return age !== null && age > expectation.healthyWithinMinutes;
    })
    .map(({ indicatorKey }) => indicatorKey);

  return {
    status: missingKeys.length > 0 ? "unknown" : worstStatus(snapshotStatuses),
    age_minutes: worstAge,
    stale_keys: staleKeys,
    missing_keys: missingKeys,
  };
}

function buildEvidenceStatus({
  observations,
  expectedDrivers,
  nowMs,
}: {
  observations?: EvidenceObservationRow[];
  expectedDrivers?: EvidenceDriverExpectation[];
  nowMs: number;
}) {
  if (!expectedDrivers || expectedDrivers.length === 0) {
    return {
      status: "healthy" as FreshnessStatus,
      drivers: {},
    };
  }

  const latestByDriverSeries = new Map<string, string>();

  for (const observation of observations ?? []) {
    const key = `${observation.driver_key}:${observation.series_key}`;
    const existing = latestByDriverSeries.get(key);
    if (!existing || Date.parse(observation.observed_at) > Date.parse(existing)) {
      latestByDriverSeries.set(key, observation.observed_at);
    }
  }

  const drivers = Object.fromEntries(
    expectedDrivers.map((driver) => {
      const seriesAges = driver.requiredSeries.map((seriesKey) => ({
        seriesKey,
        age: ageMinutes(
          latestByDriverSeries.get(`${driver.driverKey}:${seriesKey}`),
          nowMs,
        ),
      }));
      const missingSeries = seriesAges
        .filter((series) => series.age === null)
        .map((series) => series.seriesKey);
      const knownAges = seriesAges
        .map((series) => series.age)
        .filter((age): age is number => age !== null);
      const worstAge = knownAges.length > 0 ? Math.max(...knownAges) : null;
      const staleSeries = seriesAges
        .filter(
          (series) =>
            series.age !== null && series.age > driver.healthyWithinMinutes,
        )
        .map((series) => series.seriesKey);
      const status = missingSeries.length > 0
        ? "unknown"
        : statusFromAge(
          worstAge,
          driver.healthyWithinMinutes,
          driver.delayedWithinMinutes,
        );

      return [
        driver.driverKey,
        {
          status,
          age_minutes: worstAge,
          stale_series: staleSeries,
          missing_series: missingSeries,
          methodology_version: driver.methodologyVersion,
          source_url: driver.sourceUrl,
        },
      ];
    }),
  ) as FreshnessReport["evidence_sources"]["drivers"];

  return {
    status: worstStatus(Object.values(drivers).map((driver) => driver.status)),
    drivers,
  };
}

export function buildFreshnessReport({
  latestSnapshotAt,
  snapshots,
  expectedIndicators,
  snapshotExpectations,
  evidenceObservations,
  expectedEvidenceDrivers,
  runLogs,
  now = new Date(),
}: {
  latestSnapshotAt?: string | null;
  snapshots?: SnapshotRow[];
  expectedIndicators?: string[];
  snapshotExpectations?: SnapshotFreshnessExpectation[];
  evidenceObservations?: EvidenceObservationRow[];
  expectedEvidenceDrivers?: EvidenceDriverExpectation[];
  runLogs: RunLog[];
  now?: Date;
}): FreshnessReport {
  const nowMs = now.getTime();
  const snapshotStatus = buildSnapshotStatus({
    latestSnapshotAt,
    snapshots,
    expectedIndicators,
    snapshotExpectations,
    nowMs,
  });
  const alertLog = latestRunLog(runLogs, "alerts_evaluate");
  const ingestLog = latestRunLog(runLogs, "indicator_ingest");
  const evidenceStatus = buildEvidenceStatus({
    observations: evidenceObservations,
    expectedDrivers: expectedEvidenceDrivers,
    nowMs,
  });
  const hasEvidenceRequirements = Boolean(expectedEvidenceDrivers?.length);
  const primaryDataStatus = hasEvidenceRequirements
    ? evidenceStatus.status
    : snapshotStatus.status;
  const alertAge = ageMinutes(alertLog?.finished_at, nowMs);
  const ingestAge = ageMinutes(ingestLog?.finished_at, nowMs);

  const dataStatus = snapshotStatus.status;
  const alertStatus = alertLog?.status === "error"
    ? "failed"
    : statusFromAge(alertAge, 15, 30);
  const ingestRateLimited = /429|rate limit/i.test(ingestLog?.error ?? "");
  const ingestStatus = ingestLog?.status === "error"
    ? primaryDataStatus === "healthy" &&
        (ingestLog.metadata?.partial || ingestRateLimited)
      ? "delayed"
      : "failed"
    : statusFromAge(ingestAge, 24 * 60, 48 * 60);

  return {
    data_snapshots: {
      status: dataStatus,
      age_minutes: snapshotStatus.age_minutes,
      stale_keys: snapshotStatus.stale_keys,
      missing_keys: snapshotStatus.missing_keys,
    },
    alert_evaluator: {
      status: alertStatus,
      age_minutes: alertAge,
      last_error: alertLog?.error ?? null,
    },
    ingest: {
      status: ingestStatus,
      age_minutes: ingestAge,
      last_error: ingestLog?.error ?? null,
    },
    evidence_sources: evidenceStatus,
    overall: worstStatus([primaryDataStatus, alertStatus, ingestStatus]),
  };
}
