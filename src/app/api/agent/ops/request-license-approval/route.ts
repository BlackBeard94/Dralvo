/**
 * POST /api/agent/ops/request-license-approval
 *
 * Called by the VPS bot after a customer asks for their free TiGold license
 * (from the dashboard "Activate via Telegram" flow). The webapp resolves the
 * customer + which affiliate/partner link they came from, then DMs the OWNER a
 * one-tap approval message so the owner sees exactly who is requesting and who
 * to credit before granting.
 *
 * Auth: agent key with scope `ops:grant_key`.
 * Body: { email: string }  — the customer's Dralvo account email.
 * Sends to: OWNER_TELEGRAM_CHAT_ID via @dralvo_bot.
 */
import { NextResponse, type NextRequest } from "next/server";

import { verifyAgentKey } from "@/lib/agent/keys";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getReferralSource } from "@/lib/referral-source";
import { signGrantToken } from "@/lib/license-approval-token";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";
const APPROVE_TTL_SEC = 72 * 60 * 60; // 72h

async function findUserByEmail(
  sb: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  email: string,
): Promise<{ id: string } | null> {
  const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const ql = email.trim().toLowerCase();
  const u = (data?.users ?? []).find((x) => x.email?.toLowerCase() === ql);
  return u ? { id: u.id } : null;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAgentKey(request, "ops:grant_key")))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const secret = process.env.LICENSE_APPROVE_SECRET;
  const ownerChat = process.env.OWNER_TELEGRAM_CHAT_ID;
  if (!secret) return NextResponse.json({ error: "approval_secret_not_set" }, { status: 500 });
  if (!ownerChat) return NextResponse.json({ error: "owner_chat_not_set" }, { status: 500 });

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim();
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const user = await findUserByEmail(sb, email);
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const referredBy = await getReferralSource(sb, user.id);

  const exp = Math.floor(Date.now() / 1000) + APPROVE_TTL_SEC;
  const sig = signGrantToken(secret, user.id, exp);
  const approveUrl = `${SITE}/api/agent/ops/license-grant-approve?uid=${encodeURIComponent(user.id)}&exp=${exp}&sig=${sig}`;

  const src = referredBy
    ? `👥 Đến từ: <b>${referredBy.type === "partner" ? "partner" : "affiliate"}</b> — ${referredBy.email ?? "(không rõ email)"}`
    : `👥 Đăng ký trực tiếp (không qua link giới thiệu)`;

  const message = [
    `🔑 <b>YÊU CẦU CẤP LICENSE (TiGold miễn phí)</b>`,
    ``,
    `👤 Khách: <code>${email}</code>`,
    src,
    ``,
    `Bấm nút bên dưới để cấp license vào đúng tài khoản Dralvo của khách. Khách sẽ nhận key + link tải ngay trong chat.`,
  ].join("\n");

  const sent = await sendTelegramMessage(ownerChat, message, [
    [{ text: "✅ Duyệt & cấp key", url: approveUrl }],
  ]);

  return NextResponse.json({ ok: sent, notifiedOwner: sent, referredBy });
}
