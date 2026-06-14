export type DriverHistoryPoint = {
  observedAt: string;
  value: number;
};

export function summarizeDriverHistory(points: DriverHistoryPoint[]) {
  const valid = points
    .filter(
      (point) =>
        Number.isFinite(point.value) &&
        Number.isFinite(Date.parse(point.observedAt)),
    )
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const latest = valid.at(-1) ?? null;
  const previous = valid.at(-2) ?? null;

  if (!latest) {
    return {
      latest: null,
      change: null,
      percentile: null,
      minimum: null,
      maximum: null,
    };
  }

  const values = valid.map((point) => point.value);
  const atOrBelow = values.filter((value) => value <= latest.value).length;

  return {
    latest,
    change: previous ? latest.value - previous.value : null,
    percentile: Math.round((atOrBelow / values.length) * 100),
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  };
}
