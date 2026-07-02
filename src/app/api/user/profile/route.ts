/**
 * GET/POST /api/user/profile — self-service account: name + avatar.
 *   GET            → { email, emailVerified, fullName, avatarUrl }
 *   POST json      → { action: "update_name", fullName }
 *   POST multipart → action=avatar + file  (uploads to the public 'avatars' bucket)
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const BUCKET = "avatars";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data } = await admin.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
  return NextResponse.json({
    email: user.email,
    emailVerified: !!user.email_confirmed_at,
    fullName: data?.full_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const contentType = request.headers.get("content-type") ?? "";

  try {
    // Avatar upload (multipart).
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json({ error: "Thiếu ảnh" }, { status: 400 });
      }
      if (file.size > 3 * 1024 * 1024) {
        return NextResponse.json({ error: "Ảnh tối đa 3MB" }, { status: 400 });
      }
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${user.id}/${randomUUID()}.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
        contentType: file.type || "image/png",
        upsert: true,
      });
      if (upErr) return NextResponse.json({ error: `Upload thất bại: ${upErr.message}` }, { status: 500 });
      const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      await admin.from("profiles").update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
      return NextResponse.json({ success: true, avatarUrl: publicUrl });
    }

    // JSON actions.
    const body = await request.json();
    if (body.action === "update_name") {
      const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 80) : "";
      await admin.from("profiles").update({ full_name: fullName || null, updated_at: new Date().toISOString() }).eq("id", user.id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[User Profile]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
