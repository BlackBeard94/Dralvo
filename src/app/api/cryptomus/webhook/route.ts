/**
 * POST /api/cryptomus/webhook — payment result callback from Cryptomus.
 *
 * Verifies the md5 signature, marks the matching order paid (idempotent),
 * mints a permanent unguessable download token and e-mails the buyer their
 * download link. Always answers 200 on a *validly signed* request so Cryptomus
 * stops retrying; unsigned/unknown requests get 4xx.
 */
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/email";
import { PAID_STATUSES, verifyWebhookSignature } from "@/lib/cryptomus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com").replace(/\/$/, "");
const SUPPORT_TG = "https://t.me/dralvoea";

function downloadEmail(params: { eaName: string; link: string; orderId: string }) {
  const { eaName, link, orderId } = params;
  return {
    subject: `Dralvo — Link tải ${eaName}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#060609;color:#EDE8E0;font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#0C0C14;border:1px solid #1A1A2A;border-radius:12px;padding:28px;">
    <h2 style="color:#D4A843;margin:0 0 8px;font-size:20px;">Thanh toán thành công 🎉</h2>
    <p style="margin:0 0 20px;color:#9A958A;font-size:14px;line-height:1.6;">
      Cảm ơn bạn đã mua <b style="color:#EDE8E0;">${eaName}</b>. Bạn dùng <b style="color:#EDE8E0;">vĩnh viễn</b>, không giới hạn thời gian.
    </p>
    <a href="${link}" style="display:inline-block;background:#D4A843;color:#060609;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Tải ${eaName}</a>
    <p style="margin:20px 0 0;font-size:12px;color:#9A958A;line-height:1.6;">
      Link tải này là <b style="color:#EDE8E0;">của riêng bạn</b> — hãy lưu lại email này để tải lại bất cứ lúc nào.<br>
      Nếu nút không bấm được, copy link sau vào trình duyệt:<br>
      <span style="color:#8a9099;word-break:break-all;">${link}</span>
    </p>
    <p style="margin:22px 0 0;padding-top:16px;border-top:1px solid #1A1A2A;font-size:11px;color:#5C5852;line-height:1.6;">
      Mã đơn: ${orderId}<br>
      Cần hỗ trợ cài đặt? Nhắn Telegram <a href="${SUPPORT_TG}" style="color:#D4A843;">@dralvoea</a><br>
      Dralvo cung cấp công cụ giao dịch, không phải lời khuyên tài chính. Giao dịch có rủi ro mất vốn.
    </p>
  </div>
</body></html>`,
  };
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!verifyWebhookSignature(body)) {
    console.warn("[cryptomus/webhook] bad signature");
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  const orderId = String(body.order_id ?? "").trim();
  const status = String(body.payment_status ?? "").trim();
  if (!orderId) return NextResponse.json({ error: "missing_order" }, { status: 400 });

  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const { data: order } = await sb
    .from("vault_orders")
    .select("id, status, email, download_token, ea_id, vault_eas(name)")
    .eq("provider_order_id", orderId)
    .maybeSingle();

  if (!order) {
    console.warn(`[cryptomus/webhook] unknown order ${orderId}`);
    return NextResponse.json({ error: "unknown_order" }, { status: 404 });
  }

  // Not a success state → record it and stop (Cryptomus also sends interim states).
  if (!PAID_STATUSES.has(status)) {
    if (order.status === "pending" && (status === "cancel" || status === "fail" || status === "system_fail")) {
      await sb.from("vault_orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    }
    return NextResponse.json({ ok: true, ignored: status });
  }

  // Idempotent: a repeat callback must not mint a new token or re-send mail.
  if (order.status === "paid" && order.download_token) {
    return NextResponse.json({ ok: true, already: true });
  }

  const token = randomBytes(24).toString("hex");
  const { error: updErr } = await sb
    .from("vault_orders")
    .update({
      status: "paid",
      download_token: token,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (updErr) {
    console.error("[cryptomus/webhook] update failed:", updErr.message);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  const eaRel = order.vault_eas as { name?: string } | { name?: string }[] | null;
  const eaName = (Array.isArray(eaRel) ? eaRel[0]?.name : eaRel?.name) ?? "EA";
  const link = `${SITE}/api/store/download?token=${token}`;
  const mail = downloadEmail({ eaName, link, orderId });
  const sent = await sendEmail({ to: order.email, ...mail });

  console.warn(`[cryptomus/webhook] PAID order=${orderId} ea="${eaName}" email=${order.email} mail_sent=${sent}`);
  return NextResponse.json({ ok: true });
}
