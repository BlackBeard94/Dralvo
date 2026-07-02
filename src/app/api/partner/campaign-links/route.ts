/**
 * GET/POST /api/partner/campaign-links — a partner's OWN UTM ad links. Every
 * link is forced to carry THIS partner's referral code (?p=CODE), and reads/
 * deletes are scoped to their own rows. Mirrors the admin builder API.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getPartner } from "@/lib/partners/auth";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com").replace(/\/$/, "");

function cleanUtm(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase().replace(/[^a-z0-9_.\- ]/g, "").replace(/\s+/g, "_").slice(0, 80);
}
function cleanPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "/";
  let p = raw.trim().split(/[?#]/)[0];
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/[^A-Za-z0-9/_\-]/g, "");
  return p || "/";
}

export async function GET() {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data, error } = await client
    .from("campaign_links")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[Partner Campaign Links] get", error);
    return NextResponse.json({ error: "Không tải được link." }, { status: 500 });
  }
  return NextResponse.json({ links: data ?? [], code: partner.code });
}

export async function POST(request: NextRequest) {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();

    if (body.action === "delete") {
      if (!body.id) return NextResponse.json({ error: "Thiếu id." }, { status: 400 });
      // Scope the delete to the partner's own rows.
      const { error } = await client
        .from("campaign_links")
        .delete()
        .eq("id", body.id)
        .eq("partner_id", partner.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const source = cleanUtm(body.utm_source);
    if (!source) return NextResponse.json({ error: "utm_source là bắt buộc." }, { status: 400 });

    const basePath = cleanPath(body.base_path);
    const utm = {
      utm_source: source,
      utm_medium: cleanUtm(body.utm_medium),
      utm_campaign: cleanUtm(body.utm_campaign),
      utm_content: cleanUtm(body.utm_content),
    };

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(utm)) if (v) params.set(k, v);
    params.set("p", partner.code); // always the partner's own code
    const fullUrl = `${SITE_URL}${basePath}?${params.toString()}`;

    const { data, error } = await client
      .from("campaign_links")
      .insert({
        label: typeof body.label === "string" ? body.label.slice(0, 120) : null,
        base_path: basePath,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
        utm_content: utm.utm_content || null,
        partner_id: partner.id,
        full_url: fullUrl,
        created_by: partner.user_id,
      })
      .select("id, full_url")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, link: data });
  } catch (e) {
    console.error("[Partner Campaign Links] post", e);
    return NextResponse.json({ error: "Không lưu được link." }, { status: 500 });
  }
}
