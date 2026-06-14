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
        setAll() {
          // No-op in server context. Session is managed by proxy.
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

