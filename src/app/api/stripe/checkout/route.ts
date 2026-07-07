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

type CheckoutPlan = "unlimited";
type CheckoutPeriod = "monthly" | "sixmo" | "yearly";

const PLANS: CheckoutPlan[] = ["unlimited"];
const PERIODS: CheckoutPeriod[] = ["monthly", "sixmo", "yearly"];

/**
 * Resolve the Stripe price id for a (plan, period). Convention:
 *   STRIPE_PRICE_UNLIMITED_MONTHLY, STRIPE_PRICE_UNLIMITED_YEARLY, ...
 */
function resolvePriceId(plan: CheckoutPlan, period: CheckoutPeriod) {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`;
  const priceId = process.env[key];
  if (!priceId) {
    throw new Error(`Stripe price not configured for ${plan}/${period} (${key}).`);
  }
  return priceId;
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

async function createCheckoutSession(
  request: NextRequest,
  plan: CheckoutPlan = "unlimited",
  period: CheckoutPeriod = "monthly",
) {
  const priceId = resolvePriceId(plan, period);

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

  // Stripe Tax — auto-calculates VAT/sales tax from the customer's billing
  // address and collects it at checkout (and on every renewal invoice). Gated
  // by an env flag so it stays OFF until Stripe Tax is configured in the
  // Dashboard (origin address + registrations) and each price has a
  // tax_behavior — otherwise Stripe would reject the session and break checkout.
  const taxEnabled = process.env.STRIPE_TAX_ENABLED === "true";

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    ...(taxEnabled
      ? {
          automatic_tax: { enabled: true },
          // Tax needs an address; also let business customers enter a VAT/Tax ID
          // (enables EU reverse-charge etc.).
          billing_address_collection: "required" as const,
          tax_id_collection: { enabled: true },
        }
      : {}),
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
        period,
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
      plan,
      period,
    },
  });

  await recordProductEvent({
    userId: user.id,
    eventName: "checkout_started",
    properties: { payment_method: "stripe", plan, period },
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

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const plan = PLANS.includes(body?.plan as CheckoutPlan)
    ? (body.plan as CheckoutPlan)
    : "unlimited";
  const period = PERIODS.includes(body?.period as CheckoutPeriod)
    ? (body.period as CheckoutPeriod)
    : "monthly";

  try {
    const { sessionUrl } = await createCheckoutSession(request, plan, period);

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
