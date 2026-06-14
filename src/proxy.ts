import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_API_ROUTES = new Set([
  "/api/alerts/evaluate",
  "/api/ingest",
  "/api/waitlist",
  "/api/xauusd",
  "/api/stripe/webhook",
  "/api/sepay/webhook",
  "/api/sepay/reconcile",
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
