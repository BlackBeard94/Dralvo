import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_API_ROUTES = new Set([
  "/api/alerts/evaluate",
  "/api/ingest",
  "/api/waitlist",
  "/api/xauusd",
  "/api/stripe/webhook",
  "/api/telegram/webhook",
]);

function safeInternalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Edge IP geolocation (Vercel / Cloudflare). Exposed to the client via a
  // readable cookie so the UI can default the language and payment method by
  // country. Empty on local dev → callers gracefully fall back.
  const country = (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    ""
  ).toUpperCase();

  if (PUBLIC_API_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname === "/api/indicators" ||
    (pathname.startsWith("/api/alerts") && pathname !== "/api/alerts/evaluate");

  const isRecoveryUpdate =
    pathname === "/reset-password" &&
    request.nextUrl.searchParams.get("update") === "true";

  const isAuthPage =
    !isRecoveryUpdate &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/reset-password");

  // The only reason to resolve the user here is to gate protected routes or
  // bounce logged-in users off auth pages. Everything else — notably the
  // self-guarded API routes (/api/admin, /api/partner, /api/affiliate,
  // /api/user, …), which each re-check auth server-side — does NOT need it.
  // Skipping the auth.getUser() round-trip there removes ~250–350ms per call
  // (a huge win for the admin panel's frequent polling).
  if (!isProtectedRoute && !isAuthPage) {
    const passthrough = NextResponse.next({ request });
    if (country && request.cookies.get("dralvo-country")?.value !== country) {
      passthrough.cookies.set("dralvo-country", country, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }
    return passthrough;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(url);
  }

  // (isAuthPage / isRecoveryUpdate computed above, before the auth lookup.)
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    const redirectTarget = safeInternalRedirect(
      request.nextUrl.searchParams.get("redirect"),
    );
    const [targetPath, targetSearch = ""] = redirectTarget.split("?", 2);
    url.pathname = targetPath;
    url.search = targetSearch ? `?${targetSearch}` : "";
    return NextResponse.redirect(url);
  }

  if (country && request.cookies.get("dralvo-country")?.value !== country) {
    supabaseResponse.cookies.set("dralvo-country", country, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
