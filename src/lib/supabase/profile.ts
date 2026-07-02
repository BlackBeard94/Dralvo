import type { User } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recordAdminEvent } from "@/lib/admin/events";
import { captureMarketingContact } from "@/lib/marketing/contacts";
import { notifyUser } from "@/lib/system-notifications";
import { sendEmail } from "@/lib/notifications/email";

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

  // New account → notify the backoffice + capture the email for marketing.
  await recordAdminEvent({
    type: "user_signup",
    title: `Người dùng mới: ${user.email ?? user.id.slice(0, 8)}`,
    metadata: { userId: user.id },
  });
  await captureMarketingContact(user.id, user.email ?? null, "signup");

  // Welcome the new user in-app + by email (best-effort).
  await notifyUser(user.id, {
    title: "Chào mừng đến Dralvo 🎉",
    body: "Tài khoản của bạn đã sẵn sàng. Khám phá dashboard và nâng cấp VIP để mở khóa Kho EA.",
    level: "success",
    href: "/dashboard",
  });
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: "Chào mừng đến Dralvo",
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0e1116">Chào mừng đến Dralvo 🎉</h2>
        <p>Tài khoản <b>${user.email}</b> đã được tạo thành công.</p>
        <p>Đăng nhập để khám phá dashboard, công cụ và nâng cấp VIP để mở khóa Kho EA.</p>
        <p><a href="https://www.dralvo.com/dashboard" style="display:inline-block;background:#F0B90B;color:#060609;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Vào Dashboard</a></p>
      </div>`,
    });
  }
}

