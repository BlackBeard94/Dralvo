import { NextResponse } from "next/server";

import { isPaidTier, planDisplayName, resolvePlan } from "@/lib/plan";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LicenseRow = {
  plan: string | null;
  expires_at: string | null;
  is_lifetime: boolean | null;
  created_at: string;
};
type SubRow = {
  plan_tier?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  stripe_subscription_id?: string | null;
  created_at?: string | null;
};

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:billing:get"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const [{ data: licenses }, { data: sub }] = await Promise.all([
    admin
      .from("license_keys")
      .select("plan, expires_at, is_lifetime, created_at")
      .eq("user_id", user.id),
    admin
      .from("subscriptions")
      .select("plan_tier, status, current_period_end, stripe_subscription_id, created_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const now = Date.now();
  const rows = (licenses ?? []) as LicenseRow[];
  const bestLicense =
    rows.find(
      (l) =>
        l.plan === "unlimited" &&
        (l.is_lifetime === true || (!!l.expires_at && new Date(l.expires_at).getTime() > now)),
    ) ?? null;

  const details = resolvePlan(bestLicense, (sub as SubRow | null) ?? null);
  const isPaid = isPaidTier(details.planTier);
  const isLifetime =
    details.planSource === "license" && !!bestLicense?.is_lifetime && !bestLicense?.expires_at;

  // Activation date — earliest license grant, or the subscription start.
  let activatedAt: string | null = null;
  if (details.planSource === "license" && rows.length > 0) {
    activatedAt =
      rows
        .map((l) => l.created_at)
        .filter(Boolean)
        .sort()[0] ?? null;
  } else if (details.planSource === "subscription") {
    activatedAt = (sub as SubRow | null)?.created_at ?? null;
  }

  return NextResponse.json(
    {
      plan: planDisplayName(details.planTier),
      isPaid,
      source: details.planSource,
      status: details.planStatus,
      isLifetime,
      activatedAt,
      expiresAt: isLifetime ? null : details.currentPeriodEnd,
      canManageBilling: details.planSource === "subscription",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
