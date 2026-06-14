import { NextResponse } from "next/server";

import {
  buildThesisTimeline,
  type StoredThesisSnapshot,
} from "@/lib/intelligence/thesis-history";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Thesis store is not configured" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("thesis_snapshots")
    .select(
      "thesis_date,state,thesis_json,methodology_version,generated_at",
    )
    .order("generated_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    timeline: buildThesisTimeline((data ?? []) as StoredThesisSnapshot[]),
  });
}
