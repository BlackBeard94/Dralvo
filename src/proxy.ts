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

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname === "/api/indicators" ||
    (pathname.startsWith("/api/alerts") && pathname !== "/api/alerts/evaluate");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(url);
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/reset-password";

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
