import { NextResponse } from "next/server";

import {
  isProductEventName,
  normalizeDashboardRoute,
  recordProductEvent,
} from "@/lib/product-analytics";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

const CLIENT_EVENT_NAMES = new Set(["dashboard_view"]);

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "analytics:events:post"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    event_name?: unknown;
    route_path?: unknown;
    properties?: unknown;
  } | null;
  if (
    !body ||
    !isProductEventName(body.event_name) ||
    !CLIENT_EVENT_NAMES.has(body.event_name)
  ) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const routePath = normalizeDashboardRoute(body.route_path);
  if (!routePath) {
    return NextResponse.json({ error: "Invalid route" }, { status: 400 });
  }

  const recorded = await recordProductEvent({
    userId: user.id,
    eventName: body.event_name,
    routePath,
    properties: body.properties,
  });

  return NextResponse.json(
    { recorded },
    { status: recorded ? 201 : 503 },
  );
}
