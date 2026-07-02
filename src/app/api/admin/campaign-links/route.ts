/**
 * GET/POST /api/admin/campaign-links — saved UTM ad links.
 *   GET                          → list (newest first), with partner code/name
 *   POST { action: "create", … } → build + store a link (full_url computed here)
 *   POST { action: "delete", id } → remove a link
 *
 * Gated by finance.view. The canonical origin comes from NEXT_PUBLIC_SITE_URL.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin/auth";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com").replace(/\/$/, "");

/** UTM token: lowercase, url-friendly. Empty → "". */
function cleanUtm(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase().replace(/[^a-z0-9_.\- ]/g, "").replace(/\s+/g, "_").slice(0, 80);
}

/** On-site path; must start with "/", no protocol/host/query/hash. */
function cleanPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "/";
  let p = raw.trim().split(/[?#]/)[0];
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/[^A-Za-z0-9/_\-]/g, "");
  return p || "/";
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "super_admin" && !admin.permissions.finance?.view) {
    return NextResponse.json({ error: "Bạn không có quyền xem mục này." }, { status: 403 });
  }
  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const [{ data: links }, { data: partners }] = await Promise.all([
    client.from("campaign_links").select("*").order("created_at", { ascending: false }).limit(200),
    client.from("partners").select("id, code, name"),
  ]);
  const pm = new Map((partners ?? []).map((p) => [p.id as string, p]));

  return NextResponse.json({
    links: (links ?? []).map((l) => ({
      ...l,
      partner_label: l.partner_id ? (pm.get(l.partner_id)?.name || pm.get(l.partner_id)?.code || null) : null,
    })),
    partners: partners ?? [],
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "super_admin" && !admin.permissions.finance?.view) {
    return NextResponse.json({ error: "Bạn không có quyền." }, { status: 403 });
  }
  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();

    if (body.action === "delete") {
      if (!body.id) return NextResponse.json({ error: "Thiếu id." }, { status: 400 });
      const { error } = await client.from("campaign_links").delete().eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // create
    const source = cleanUtm(body.utm_source);
    if (!source) return NextResponse.json({ error: "utm_source là bắt buộc." }, { status: 400 });

    const basePath = cleanPath(body.base_path);
    const utm = {
      utm_source: source,
      utm_medium: cleanUtm(body.utm_medium),
      utm_campaign: cleanUtm(body.utm_campaign),
      utm_content: cleanUtm(body.utm_content),
      utm_term: cleanUtm(body.utm_term),
    };

    // Optional partner referral code → ?p=CODE
    let partnerId: string | null = null;
    let partnerCode: string | null = null;
    if (body.partner_id) {
      const { data: partner } = await client
        .from("partners")
        .select("id, code")
        .eq("id", body.partner_id)
        .maybeSingle();
      if (!partner) return NextResponse.json({ error: "Không tìm thấy partner." }, { status: 404 });
      partnerId = partner.id as string;
      partnerCode = partner.code as string;
    }

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(utm)) if (v) params.set(k, v);
    if (partnerCode) params.set("p", partnerCode);
    const fullUrl = `${SITE_URL}${basePath}?${params.toString()}`;

    const { data, error } = await client
      .from("campaign_links")
      .insert({
        label: typeof body.label === "string" ? body.label.slice(0, 120) : null,
        base_path: basePath,
        ...utm,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
        utm_content: utm.utm_content || null,
        utm_term: utm.utm_term || null,
        partner_id: partnerId,
        full_url: fullUrl,
        created_by: admin.user_id,
      })
      .select("id, full_url")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, link: data });
  } catch (e) {
    console.error("[Admin Campaign Links]", e);
    return NextResponse.json({ error: "Không lưu được link." }, { status: 500 });
  }
}
