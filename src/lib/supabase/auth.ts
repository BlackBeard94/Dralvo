import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Get the currently authenticated user from the request cookies.
 * Must be called from a Server Component or API route.
 * Returns null if no valid session exists.
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Persist refreshed session tokens. The proxy skips getUser() for
        // self-guarded API routes (perf), so this keeps sessions alive when a
        // token rotates mid-session. try/catch: cookies() is read-only in
        // Server Components (writable only in Route Handlers / Server Actions).
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* Server Component — refresh on next page load */ }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

