import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getAlertById, updateAlert, deleteAlert } from "@/lib/alerts";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";
import type { UpdateAlertInput } from "@/types/alerts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:id:get"),
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
    if (tier !== "Pro") {
      return Response.json(
        { error: "Custom alerts require Dralvo Pro." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const alert = await getAlertById(id, user.id);

    if (!alert) {
      return Response.json({ error: "Alert not found" }, { status: 404 });
    }

    return Response.json(alert);
  } catch (err) {
    console.error("GET /api/alerts/[id] error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:id:patch"),
    limit: 30,
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
    if (tier !== "Pro") {
      return Response.json(
        { error: "Custom alerts require Dralvo Pro." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body: UpdateAlertInput = await request.json();

    const alert = await updateAlert(id, user.id, body);
    return Response.json(alert);
  } catch (err) {
    console.error("PATCH /api/alerts/[id] error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:id:delete"),
    limit: 30,
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
    if (tier !== "Pro") {
      return Response.json(
        { error: "Custom alerts require Dralvo Pro." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const deleted = await deleteAlert(id, user.id);

    if (!deleted) {
      return Response.json({ error: "Alert not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/alerts/[id] error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
