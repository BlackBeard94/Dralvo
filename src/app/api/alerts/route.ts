import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getAlertsByUserId, createAlert } from "@/lib/alerts";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";
import { isPaidTier } from "@/lib/plan";
import type { CreateAlertInput } from "@/types/alerts";
import { recordProductEvent } from "@/lib/product-analytics";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:get"),
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getUserPlanTierByUserId(user.id);
    if (!isPaidTier(tier)) {
      return Response.json(
        { error: "Custom alerts require Dralvo VIP." },
        { status: 403 },
      );
    }

    const alerts = await getAlertsByUserId(user.id);
    return Response.json(alerts);
  } catch (err) {
    console.error("GET /api/alerts error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:post"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getUserPlanTierByUserId(user.id);
    if (!isPaidTier(tier)) {
      return Response.json(
        { error: "Custom alerts require Dralvo VIP." },
        { status: 403 },
      );
    }

    const body: CreateAlertInput = await request.json();

    if (!body.indicator_key || !body.condition_json) {
      return Response.json(
        { error: "indicator_key and condition_json are required" },
        { status: 400 }
      );
    }

    const alert = await createAlert(user.id, body);
    await recordProductEvent({
      userId: user.id,
      eventName: "monitor_created",
      routePath: "/dashboard/alerts",
      properties: {
        target_type: body.indicator_key.startsWith("thesis:")
          ? "thesis"
          : "evidence",
      },
    });
    return Response.json(alert, { status: 201 });
  } catch (err) {
    console.error("POST /api/alerts error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
