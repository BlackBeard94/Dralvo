import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { syncCheckoutSession } from "@/lib/stripe-subscriptions";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/dashboard?checkout=missing_session`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // This route only reads the authenticated user from existing cookies.
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const redirectTarget = encodeURIComponent("/dashboard?checkout=sync_failed");
    return NextResponse.redirect(`${origin}/login?redirect=${redirectTarget}`);
  }

  try {
    await syncCheckoutSession(sessionId, user.id);
    return NextResponse.redirect(`${origin}/dashboard?checkout=success`);
  } catch (syncError) {
    console.error("[Stripe Checkout Success] Sync failed:", syncError);
    return NextResponse.redirect(`${origin}/dashboard?checkout=sync_failed`);
  }
}
