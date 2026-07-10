/**
 * GET /api/agent/ops/license-grant-approve?uid=<user_id>&exp=<unix>&sig=<hmac>
 *
 * One-tap owner approval for the ACCOUNT-based free TiGold license flow. The
 * owner receives this link (with the customer's email + referral source) from
 * /api/agent/ops/request-license-approval and taps it to grant the license into
 * the customer's Dralvo account. The customer is then DMed their key + links.
 *
 * Auth: HMAC-signed link (LICENSE_APPROVE_SECRET) with 72h expiry — no session.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyGrantToken } from "@/lib/license-approval-token";
import { grantLicense, isGrantProduct, TRIAL_DAYS, type GrantProduct } from "@/lib/admin/license-grant";
import { EA_CATALOG } from "@/lib/ea-catalog";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";
// Admin handle for getting a fresh key / renewing after the trial expires.
const RENEW_ADMIN = "https://t.me/edgardinh86";

function html(title: string, body: string, ok: boolean) {
  return new NextResponse(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
      `<body style="font-family:system-ui,sans-serif;background:#0b0e11;color:#e8e6e3;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">` +
      `<div style="max-width:420px;padding:32px;text-align:center"><div style="font-size:48px">${ok ? "✅" : "⚠️"}</div>` +
      `<h1 style="font-size:20px;color:${ok ? "#d4af37" : "#e07050"}">${title}</h1><p style="color:#a8a29a;line-height:1.6">${body}</p></div></body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  const secret = process.env.LICENSE_APPROVE_SECRET;
  if (!secret) return html("Chưa cấu hình", "LICENSE_APPROVE_SECRET chưa được set trên server.", false);

  const q = request.nextUrl.searchParams;
  const uid = (q.get("uid") ?? "").trim();
  const productParam = q.get("product");
  const product: GrantProduct = isGrantProduct(productParam) ? productParam : "tigold";
  const exp = Number(q.get("exp") ?? 0);
  const sig = (q.get("sig") ?? "").trim();

  if (!uid || !exp || !sig || !verifyGrantToken(secret, uid, product, exp, sig)) {
    return html("Link không hợp lệ", "Chữ ký sai hoặc thiếu tham số. Dùng đúng nút trong tin nhắn Telegram.", false);
  }
  if (Date.now() / 1000 > exp) {
    return html("Link đã hết hạn", "Nút duyệt này quá 72 giờ. Nhờ khách bấm lấy key lại để nhận nút mới.", false);
  }

  const sb = getSupabaseAdminClient();
  if (!sb) return html("Lỗi hệ thống", "Không kết nối được database. Thử lại sau.", false);

  // Resolve the customer account.
  const { data: u } = await sb.auth.admin.getUserById(uid);
  const email = u?.user?.email ?? null;
  if (!email) return html("Không tìm thấy khách", "Tài khoản không còn tồn tại.", false);

  const ea = EA_CATALOG[product];

  // Grant the requested EA into this Dralvo account (idempotent). plan="tigold"
  // marks it a free-tier single-EA license — NOT "unlimited". Every IB grant is a
  // TRIAL_DAYS-day trial key (expires, then renew by contacting the admin).
  const result = await grantLicense({ email, plan: "tigold", product, expiresInDays: TRIAL_DAYS });
  if (!result.ok) {
    return html("Lỗi cấp license", `Không cấp được license (${result.error}). Thử lại sau.`, false);
  }

  // Fetch the granted key + expiry to hand to the customer.
  const { data: lic } = await sb
    .from("license_keys")
    .select("key, expires_at")
    .eq("user_id", uid)
    .eq("product", product)
    .maybeSingle();
  const licenseKey = (lic?.key as string | undefined) ?? null;
  const expiresAt = (lic?.expires_at as string | null | undefined) ?? null;
  const expiryLabel = expiresAt ? new Date(expiresAt).toLocaleDateString("vi-VN") : null;

  // DM the customer their key + downloads (best-effort).
  let dmSent = false;
  const { data: profile } = await sb
    .from("profiles")
    .select("telegram_chat_id")
    .eq("id", uid)
    .maybeSingle();
  const chat = profile?.telegram_chat_id as string | null;
  const enc = (p: string) => encodeURI(SITE + p);
  if (chat && licenseKey) {
    dmSent = await sendTelegramMessage(
      chat,
      [
        `🎉 <b>License ${ea.name} của bạn đã được kích hoạt!</b>`,
        ``,
        `🤖 EA: <b>${ea.name}</b>`,
        `🔑 License key: <code>${licenseKey}</code>`,
        `👤 Gắn với tài khoản Dralvo: <code>${email}</code>`,
        `⏳ Key dùng thử <b>${TRIAL_DAYS} ngày</b>${expiryLabel ? ` — hết hạn <b>${expiryLabel}</b>` : ""}.`,
        ``,
        `📥 <b>Tải về:</b>`,
        `• EA: ${enc(ea.ex5)}`,
        `• Preset: ${enc(ea.set)}`,
        `• Hướng dẫn: ${enc(ea.guide)}`,
        ``,
        `⚙️ Cài EA vào MT5 → cho phép WebRequest tới dralvo.com → nhập license key → chạy theo hướng dẫn.`,
        `🔄 Hết hạn muốn lấy key mới / gia hạn: nhắn admin ${RENEW_ADMIN}`,
        `❓ Cần hỗ trợ: @dralvoea`,
      ].join("\n"),
    );
  }

  console.warn(`[license-grant-approve] APPROVED uid=${uid} product=${product} email=${email} key=${licenseKey?.slice(0, 8)}… dm=${dmSent}`);
  return html(
    "Đã cấp license ✅",
    `Đã cấp <b>${ea.name}</b> cho <b>${email}</b>${
      dmSent
        ? ` và đã nhắn key + link tải cho khách qua @dralvo_bot.`
        : licenseKey
          ? `. Khách chưa liên kết Telegram — key đã có trong dashboard của họ.`
          : `.`
    }`,
    true,
  );
}
