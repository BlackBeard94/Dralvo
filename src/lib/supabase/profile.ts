import type { User } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

const DEFAULT_NOTIFICATION_PREFS = {
  email: true,
  telegram: false,
  in_app: true,
};

function getFullName(user: Pick<User, "user_metadata">) {
  return typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : null;
}

export async function ensureProfile(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !user.email) return;

  const fullName = getFullName(user);
  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) return;

  if (existing) {
    await supabase
      .from("profiles")
      .update({
        email: user.email,
        full_name: fullName,
        updated_at: now,
      })
      .eq("id", user.id);
    return;
  }

  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    notification_prefs: DEFAULT_NOTIFICATION_PREFS,
    updated_at: now,
  });
}

