import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";
import { recordProductEvent } from "@/lib/product-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EvidenceExportRow {
  source_key: string;
  driver_key: string;
  series_key: string;
  numeric_value: number;
  unit: string;
  observed_at: string;
  released_at: string | null;
  retrieved_at: string;
  source_url: string;
  quality: string;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return iso;
  }
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserPlanTierByUserId(user.id);
  if (tier !== "Pro") {
    return NextResponse.json(
      { error: "CSV export is a Pro feature. Upgrade to access." },
      { status: 402 },
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("evidence_observations")
    .select(
      "source_key,driver_key,series_key,numeric_value,unit,observed_at,released_at,retrieved_at,source_url,quality",
    )
    .order("observed_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[csv-export] Supabase read error", JSON.stringify(error));
    return NextResponse.json(
      { error: "Failed to read evidence data" },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as EvidenceExportRow[];

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No verified evidence data available" },
      { status: 404 },
    );
  }

  // Build CSV header
  const headers = [
    "source_key",
    "driver_key",
    "series_key",
    "numeric_value",
    "unit",
    "observed_at",
    "released_at",
    "retrieved_at",
    "quality",
    "source_url",
  ];

  const csvLines: string[] = [headers.join(",")];

  for (const row of rows) {
    const fields = [
      row.source_key,
      row.driver_key,
      row.series_key,
      String(row.numeric_value),
      row.unit,
      formatTimestamp(row.observed_at),
      row.released_at ? formatTimestamp(row.released_at) : "",
      formatTimestamp(row.retrieved_at),
      row.quality,
      row.source_url,
    ].map(escapeCsvField);

    csvLines.push(fields.join(","));
  }

  const csvContent = csvLines.join("\n");

  await recordProductEvent({
    userId: user.id,
    eventName: "evidence_exported",
    routePath: "/dashboard",
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dralvo-evidence-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
