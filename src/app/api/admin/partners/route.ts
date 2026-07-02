/**
 * GET/POST /api/admin/partners
 * Super admin only: manage the Partner (reseller) program.
 * Pattern mirrors /api/admin/sub-admins (action param) + /api/admin/affiliate.
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, batchGetEmails } from "@/lib/admin/auth";
import type { Partner, PartnerCommission } from "@/lib/partners/types";

const FORBIDDEN = { error: "Chỉ super admin mới quản lý được Partner." };

/** Short uppercase alphanumeric referral code (6-8 chars) derived from a UUID. */
function generateCode(): string {
  const raw = randomUUID().replace(/-/g, "").toUpperCase();
  // strip ambiguous chars and take 8
  return raw.replace(/[^0-9A-Z]/g, "").slice(0, 8);
}

export async function GET(_request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json(FORBIDDEN, { status: 403 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data: partners, error } = await client
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin Partners] list", error);
    return NextResponse.json({ error: "Không tải được danh sách partner." }, { status: 500 });
  }

  const rows = (partners ?? []) as Partner[];
  const emails = await batchGetEmails(client, rows.map((p) => p.user_id));

  // Customer counts: profiles where referrer_type='partner' AND referrer_id=partner.id
  // Commission totals: sum commission_amount by status per partner.
  const enriched = await Promise.all(
    rows.map(async (p) => {
      const { count: customerCount } = await client
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referrer_type", "partner")
        .eq("referrer_id", p.id);

      const { data: comms } = await client
        .from("partner_commissions")
        .select("commission_amount, status")
        .eq("partner_id", p.id);

      let pendingTotal = 0;
      let paidTotal = 0;
      for (const c of comms ?? []) {
        const amt = Number(c.commission_amount) || 0;
        if (c.status === "paid") paidTotal += amt;
        else pendingTotal += amt;
      }

      return {
        ...p,
        email: emails.get(p.user_id) ?? null,
        customer_count: customerCount ?? 0,
        pending_total: pendingTotal,
        paid_total: paidTotal,
      };
    }),
  );

  return NextResponse.json({ partners: enriched });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json(FORBIDDEN, { status: 403 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case "create": {
        const { email, name, commissionRate } = payload as {
          email: string;
          name?: string;
          commissionRate: number;
        };

        if (!email) {
          return NextResponse.json({ error: "Thiếu email." }, { status: 400 });
        }
        const rate = Number(commissionRate);
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
          return NextResponse.json({ error: "Tỷ lệ hoa hồng phải nằm trong khoảng 0..1." }, { status: 400 });
        }

        // Resolve email -> user (same pattern as licenses/sub-admins routes).
        const allUsers = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const targetUser = allUsers.data?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );
        if (!targetUser) {
          return NextResponse.json({ error: "Không tìm thấy user với email này. Họ cần đăng ký trước." }, { status: 404 });
        }

        const { data: already } = await client
          .from("partners")
          .select("id")
          .eq("user_id", targetUser.id)
          .limit(1);
        if (already && already.length > 0) {
          return NextResponse.json({ error: "User này đã là partner." }, { status: 409 });
        }

        // Generate a unique code (retry on the rare collision).
        let code = generateCode();
        for (let i = 0; i < 5; i++) {
          const { data: clash } = await client.from("partners").select("id").eq("code", code).limit(1);
          if (!clash || clash.length === 0) break;
          code = generateCode();
        }

        const { error: insErr } = await client.from("partners").insert({
          user_id: targetUser.id,
          code,
          name: name ?? null,
          commission_rate: rate,
          status: "active",
          created_by: admin.user_id,
        });
        if (insErr) {
          console.error("[Admin Partners] create", insErr);
          return NextResponse.json({ error: "Không tạo được partner." }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case "update_rate": {
        const { id, commissionRate } = payload as { id: string; commissionRate: number };
        const rate = Number(commissionRate);
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
          return NextResponse.json({ error: "Tỷ lệ hoa hồng phải nằm trong khoảng 0..1." }, { status: 400 });
        }
        const { error } = await client
          .from("partners")
          .update({ commission_rate: rate, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) {
          console.error("[Admin Partners] update_rate", error);
          return NextResponse.json({ error: "Không cập nhật được tỷ lệ hoa hồng." }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case "set_status": {
        const { id, status } = payload as { id: string; status: string };
        if (status !== "active" && status !== "suspended") {
          return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
        }
        const { error } = await client
          .from("partners")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) {
          console.error("[Admin Partners] set_status", error);
          return NextResponse.json({ error: "Không cập nhật được trạng thái." }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case "mark_paid": {
        const { partnerId, period } = payload as { partnerId: string; period: string };
        if (!partnerId || !period) {
          return NextResponse.json({ error: "Thiếu partnerId hoặc period." }, { status: 400 });
        }
        const { data, error } = await client
          .from("partner_commissions")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("partner_id", partnerId)
          .eq("period", period)
          .eq("status", "pending")
          .select("id");
        if (error) {
          console.error("[Admin Partners] mark_paid", error);
          return NextResponse.json({ error: "Không đánh dấu được đã trả." }, { status: 500 });
        }
        return NextResponse.json({ success: true, count: data?.length ?? 0 });
      }

      case "commissions": {
        const { partnerId } = payload as { partnerId: string };
        if (!partnerId) {
          return NextResponse.json({ error: "Thiếu partnerId." }, { status: 400 });
        }
        const { data, error } = await client
          .from("partner_commissions")
          .select("*")
          .eq("partner_id", partnerId)
          .order("period", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) {
          console.error("[Admin Partners] commissions", error);
          return NextResponse.json({ error: "Không tải được hoa hồng." }, { status: 500 });
        }
        const rows = (data ?? []) as PartnerCommission[];
        const emails = await batchGetEmails(client, rows.map((c) => c.customer_user_id));
        const commissions = rows.map((c) => ({
          ...c,
          customer_email: emails.get(c.customer_user_id) ?? null,
        }));
        return NextResponse.json({ success: true, commissions });
      }

      default:
        return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
    }
  } catch (e) {
    console.error("[Admin Partners]", e);
    return NextResponse.json({ error: "Lỗi hệ thống." }, { status: 500 });
  }
}
