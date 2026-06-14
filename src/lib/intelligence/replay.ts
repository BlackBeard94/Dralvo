import type { EvidenceRow } from "@/lib/intelligence/gold-thesis";

export type ReplayEvidenceRow = EvidenceRow & {
  released_at: string | null;
  retrieved_at: string;
};

export function replayCutoff(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const cutoff = new Date(`${date}T23:59:59.999Z`);
  if (Number.isNaN(cutoff.getTime())) return null;

  return cutoff;
}

export function evidenceAvailableBy(
  rows: ReplayEvidenceRow[],
  cutoff: Date,
): EvidenceRow[] {
  return rows.filter((row) => {
    const availableAt = Date.parse(row.released_at ?? row.retrieved_at);
    return Number.isFinite(availableAt) && availableAt <= cutoff.getTime();
  });
}
