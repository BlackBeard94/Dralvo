/**
 * GET /api/agent/ops/license-approve — one-tap owner approval for the TiGold
 * free-license flow.
 *
 * The VPS support bot walks a customer through opening a GTC account under
 * Dralvo's IB and depositing the minimum ($100 / 10,000 cent). When the customer
 * confirms, the bot messages the OWNER (via the Hermes Telegram bot) with three
 * URL buttons pointing here. The owner eyeballs the GTC IB portal (GTC has no
 * API) and taps one:
 *
 *   action=approve      → grant lifetime license bound to the MT5 account
 *                         (idempotent, 1 account per key) + DM the customer
 *                         the key and download links via @dralvo_bot.
 *   action=deposit_wait → DM the customer that the deposit is still short.
 *   action=not_found    → DM the customer that no account was found under the IB.
 *
 * Auth: HMAC-signed link (LICENSE_APPROVE_SECRET) with expiry — no session.
 * Payload signed: lic1.<chat>.<mt5>.<broker>.<action>.<exp>
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";

const ACTIONS = ["approve", "deposit_wait", "not_found"] as const;
type Action = (typeof ACTIONS)[number];

const IB_LINKS = {
  usd: "https://web.mygtc.app/login/register?ref=hc8B8eNC",
  cent: "https://web.mygtc.app/login/register?ref=ADWMQMDP",
};

function signApprovePayload(secret: string, parts: {
  chat: string; mt5: string; broker: string; action: string; exp: number;
}): string {
  return createHmac("sha256", secret)
    .update(`lic1.${parts.chat}.${parts.mt5}.${parts.broker}.${parts.action}.${parts.exp}`)
    .digest("hex");
}

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
  const chat = (q.get("chat") ?? "").trim();
  const mt5 = (q.get("mt5") ?? "").trim();
  const broker = (q.get("broker") ?? "usd").trim();
  const name = (q.get("name") ?? "").trim().slice(0, 60);
  const action = (q.get("action") ?? "") as Action;
  const exp = Number(q.get("exp") ?? 0);
  const sig = (q.get("sig") ?? "").trim();

  // chat must be a real Telegram chat_id (integer). Non-numeric ids come from
  // internal /test calls and must never mint a license.
  if (!/^-?\d+$/.test(chat) || !/^\d{6,10}$/.test(mt5) || !ACTIONS.includes(action) || !exp || !sig) {
    return html("Link không hợp lệ", "Thiếu hoặc sai tham số. Dùng đúng nút trong tin nhắn Telegram.", false);
  }
  if (Date.now() / 1000 > exp) {
    return html("Link đã hết hạn", "Nút duyệt này quá 72 giờ. Nhờ khách xác nhận lại để nhận nút mới.", false);
  }
  const expected = signApprovePayload(secret, { chat, mt5, broker, action, exp });
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return html("Chữ ký sai", "Link không được tạo bởi hệ thống Dralvo.", false);
  }

  const who = name ? `${name} (MT5 ${mt5})` : `MT5 ${mt5}`;

  if (action === "deposit_wait") {
    await sendTelegramMessage(
      chat,
      `⏳ <b>Dralvo đã kiểm tra tài khoản MT5 ${mt5}</b>\n\nHiện chưa thấy đủ mức nạp tối thiểu <b>$100</b> (tài khoản USD) / <b>10.000 cent</b> (tài khoản Cent).\n\nBạn kiểm tra lại giao dịch nạp giúp mình nhé — tiền vào tài khoản xong bạn nhắn lại "đã nạp" là mình báo admin duyệt ngay. 🙏\n\n<i>If you need English support, just reply in English.</i>`,
    );
    console.warn(`[AUDIT license-approve] deposit_wait mt5=${mt5} chat=${chat}`);
    return html("Đã báo khách nạp thêm", `Đã nhắn ${who}: chưa đủ mức nạp tối thiểu, kiểm tra lại và xác nhận sau.`, true);
  }

  if (action === "not_found") {
    await sendTelegramMessage(
      chat,
      `❌ <b>Dralvo chưa tìm thấy tài khoản MT5 ${mt5} dưới IB Dralvo</b>\n\nCó thể tài khoản được mở không qua link đối tác của Dralvo. Bạn kiểm tra lại:\n\n1️⃣ Mở đúng link IB Dralvo:\n• USD: ${IB_LINKS.usd}\n• Cent: ${IB_LINKS.cent}\n\n2️⃣ Nếu đã có tài khoản GTC ngoài IB, bạn có thể mở thêm tài khoản MỚI qua link trên (cùng 1 email GTC được).\n\nXong bạn gửi lại số MT5 mới cho mình nhé!`,
    );
    console.warn(`[AUDIT license-approve] not_found mt5=${mt5} chat=${chat}`);
    return html("Đã báo khách kiểm tra lại", `Đã nhắn ${who}: không thấy tài khoản dưới IB, kèm hướng dẫn mở đúng link.`, true);
  }

  // action === "approve" — grant the license (idempotent on mt5_account).
  const supabase = getSupabaseAdminClient();
  if (!supabase) return html("Lỗi hệ thống", "Không kết nối được database. Thử lại sau.", false);

  const { data: existing, error: selErr } = await supabase
    .from("license_keys")
    .select("key")
    .eq("mt5_account", mt5)
    .maybeSingle();
  if (selErr) {
    console.error("[license-approve] lookup failed:", selErr.message);
    return html("Lỗi hệ thống", "Không đọc được license. Thử lại sau.", false);
  }

  let licenseKey = existing?.key ?? null;
  if (!licenseKey) {
    const { data: inserted, error: insErr } = await supabase
      .from("license_keys")
      .insert({
        mt5_account: mt5,
        plan: "tigold",
        product: "tigold",
        max_accounts: 1,
        is_lifetime: true, // TiGold qua IB: license vĩnh viễn, 1 tài khoản MT5
      })
      .select("key")
      .single();
    if (insErr) {
      if (insErr.code === "23505") {
        const { data: raced } = await supabase
          .from("license_keys").select("key").eq("mt5_account", mt5).maybeSingle();
        licenseKey = raced?.key ?? null;
      }
      if (!licenseKey) {
        console.error("[license-approve] insert failed:", insErr.message);
        return html("Lỗi cấp license", "Không tạo được license. Thử lại sau.", false);
      }
    } else {
      licenseKey = inserted?.key ?? null;
    }
  }
  if (!licenseKey) return html("Lỗi cấp license", "Không tạo được license. Thử lại sau.", false);

  const sent = await sendTelegramMessage(
    chat,
    `🎉 <b>License TiGold của bạn đã được kích hoạt!</b>\n\n🔑 License key: <code>${licenseKey}</code>\n🖥 Tài khoản MT5: <code>${mt5}</code> (license gắn với đúng tài khoản này)\n\n📥 <b>Tải về:</b>\n• EA: ${SITE}/downloads/tigold/Dralvo%20TiGold.ex5\n• Preset: ${SITE}/downloads/tigold/Dralvo%20tigold%20v1.set\n• Hướng dẫn cài đặt: ${SITE}/downloads/tigold/Huong_dan_su_dung.html\n\n⚙️ Cài EA vào MT5 → nhập license key khi EA yêu cầu → chạy trên XAUUSD M1 theo hướng dẫn.\n\n❓ Cần hỗ trợ: nhắn tại đây hoặc @dralvoea\n\n⚠️ <i>Công cụ giao dịch, không phải lời khuyên tài chính. Backtest quá khứ không bảo đảm kết quả tương lai — luôn quản lý rủi ro.</i>`,
  );
  console.warn(`[AUDIT license-approve] APPROVED mt5=${mt5} chat=${chat} key=${licenseKey.slice(0, 8)}… dm_sent=${sent}`);
  return html(
    "Đã cấp license ✅",
    `${who} — license TiGold vĩnh viễn (1 tài khoản) đã tạo${sent ? " và đã nhắn key + link tải cho khách qua @dralvo_bot." : ", NHƯNG nhắn khách thất bại — kiểm tra log."}`,
    true,
  );
}
