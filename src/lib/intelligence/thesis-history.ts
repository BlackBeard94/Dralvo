import type {
  GoldThesis,
  PriceRelationshipInsight,
  ThesisDriverState,
  ThesisState,
} from "@/lib/intelligence/gold-thesis";

export type StoredThesisSnapshot = {
  thesis_date: string;
  state: ThesisState;
  thesis_json: GoldThesis;
  methodology_version: string;
  generated_at: string;
};

export type ThesisDriverChange = {
  driverKey: string;
  label: string;
  from: ThesisDriverState["state"] | null;
  to: ThesisDriverState["state"];
};

export type ThesisTimelineEntry = {
  thesisDate: string;
  generatedAt: string;
  state: ThesisState;
  previousState: ThesisState | null;
  stateChanged: boolean;
  title: string;
  summary: string;
  methodologyVersion: string;
  driverChanges: ThesisDriverChange[];
  priceRelationshipChange: {
    from: PriceRelationshipInsight["state"] | null;
    to: PriceRelationshipInsight["state"];
  } | null;
  isInitial: boolean;
};

function compareDrivers(
  current: GoldThesis,
  previous: GoldThesis | null,
): ThesisDriverChange[] {
  if (!previous) return [];

  const previousByKey = new Map(
    previous.drivers.map((driver) => [driver.driverKey, driver]),
  );

  return current.drivers.flatMap((driver) => {
    const prior = previousByKey.get(driver.driverKey);
    if (prior?.state === driver.state) return [];

    return [
      {
        driverKey: driver.driverKey,
        label: driver.label,
        from: prior?.state ?? null,
        to: driver.state,
      },
    ];
  });
}

export function buildThesisTimeline(
  snapshots: StoredThesisSnapshot[],
): ThesisTimelineEntry[] {
  const ordered = [...snapshots].sort(
    (a, b) => Date.parse(b.generated_at) - Date.parse(a.generated_at),
  );

  return ordered.map((snapshot, index) => {
    const previous = ordered[index + 1] ?? null;

    return {
      thesisDate: snapshot.thesis_date,
      generatedAt: snapshot.generated_at,
      state: snapshot.state,
      previousState: previous?.state ?? null,
      stateChanged: previous ? snapshot.state !== previous.state : false,
      title: snapshot.thesis_json.title,
      summary: snapshot.thesis_json.summary,
      methodologyVersion: snapshot.methodology_version,
      driverChanges: compareDrivers(
        snapshot.thesis_json,
        previous?.thesis_json ?? null,
      ),
      priceRelationshipChange:
        snapshot.thesis_json.priceRelationship &&
        previous?.thesis_json.priceRelationship &&
        snapshot.thesis_json.priceRelationship.state !==
          previous.thesis_json.priceRelationship.state
          ? {
              from: previous.thesis_json.priceRelationship.state,
              to: snapshot.thesis_json.priceRelationship.state,
            }
          : null,
      isInitial: previous === null,
    };
  });
}
