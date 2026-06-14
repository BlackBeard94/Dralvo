import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function getPortalBaseUrl(request: NextRequest) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (
    process.env.NODE_ENV === "production" &&
    configuredSiteUrl &&
    configuredSiteUrl !== "http://localhost:3000"
  ) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  return (request.headers.get("origin") || request.nextUrl.origin).replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "stripe:portal"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    // 1. Get the authenticated user from Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              // @ts-expect-error - @supabase/ssr cookie set signature mismatch with Next.js 16
              request.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 },
      );
    }

    // 2. Query the subscriptions table for the Stripe customer ID
    const adminClient = getSupabaseAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    const { data: subscription, error: subError } = await adminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found for this account." },
        { status: 404 },
      );
    }

    // 3. Create a Stripe Billing Portal session
    const baseUrl = getPortalBaseUrl(request);

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/dashboard`,
    });

    // 4. Return the portal URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe Portal] Error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session." },
      { status: 500 },
    );
  }
}
