import { NextResponse, type NextRequest } from "next/server";

/**
 * Stripe checkout is retired. Dralvo no longer sells the EAs — every robot is a
 * free 3-day trial obtained by opening a GTC account under Dralvo's IB. These
 * handlers stay so any old link/bookmark degrades gracefully instead of 404ing:
 *   - GET  → redirect to the (now free) /pricing page.
 *   - POST → 410 Gone with a clear message for any lingering fetch() caller.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(`${request.nextUrl.origin}/pricing`);
}

export async function POST() {
  return NextResponse.json(
    { error: "Checkout is disabled — all Dralvo EAs are now free." },
    { status: 410 },
  );
}
