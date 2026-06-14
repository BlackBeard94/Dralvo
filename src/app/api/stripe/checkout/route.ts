import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { recordProductEvent } from "@/lib/product-analytics";

function checkoutErrorMessage(error: unknown) {
  const fallback = "Failed to create checkout session.";

  if (process.env.NODE_ENV === "production") {
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getCheckoutBaseUrl(request: NextRequest) {
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

function loginRedirect(request: NextRequest) {
  const redirect = encodeURIComponent("/api/stripe/checkout?intent=pro");
  return NextResponse.redirect(`${request.nextUrl.origin}/login?redirect=${redirect}`);
}

async function createCheckoutSession(request: NextRequest) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error("STRIPE_PRO_PRICE_ID is not configured.");
  }

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
    return { user: null, sessionUrl: null };
  }

  const baseUrl = getCheckoutBaseUrl(request);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    subscription_data: {
      trial_period_days: 3,
      metadata: {
        user_id: user.id,
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
    },
  });

  await recordProductEvent({
    userId: user.id,
    eventName: "checkout_started",
    properties: { payment_method: "stripe" },
  });

  return { user, sessionUrl: session.url };
}

function checkCheckoutRateLimit(request: NextRequest) {
  return checkRateLimit({
    key: rateLimitKey(request, "stripe:checkout"),
    limit: 10,
    windowMs: 60_000,
  });
}

export async function GET(request: NextRequest) {
  const rateLimit = checkCheckoutRateLimit(request);

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const { sessionUrl } = await createCheckoutSession(request);

    if (!sessionUrl) {
      return loginRedirect(request);
    }

    return NextResponse.redirect(sessionUrl);
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/pricing?checkout=error`,
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "stripe:checkout"),
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const { sessionUrl } = await createCheckoutSession(request);

    if (!sessionUrl) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 },
      );
    }

    return NextResponse.json({ url: sessionUrl });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: checkoutErrorMessage(error) },
      { status: 500 },
    );
  }
}
