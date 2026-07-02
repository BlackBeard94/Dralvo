import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getStripe } from "@/lib/stripe";
import { syncCheckoutSession } from "@/lib/stripe-subscriptions";
import { recordAdminEvent } from "@/lib/admin/events";
import { captureMarketingContact } from "@/lib/marketing/contacts";
import { recordAffiliateCommission } from "@/lib/affiliate/server";
import { notifyUser } from "@/lib/system-notifications";
import { sendEmail } from "@/lib/notifications/email";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/dashboard?checkout=missing_session`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // This route only reads the authenticated user from existing cookies.
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const redirectTarget = encodeURIComponent("/dashboard?checkout=sync_failed");
    return NextResponse.redirect(`${origin}/login?redirect=${redirectTarget}`);
  }

  try {
    await syncCheckoutSession(sessionId, user.id);

    // Capture the buyer email for marketing (idempotent).
    await captureMarketingContact(user.id, user.email ?? null, "payment");

    // Pass purchase value/currency to the dashboard so the browser pixels can
    // fire a Purchase conversion (Google Ads especially). The server webhook
    // already records the deduped server-side copy keyed by the same id.
    const success = new URL(`${origin}/dashboard`);
    success.searchParams.set("checkout", "success");
    success.searchParams.set("oid", sessionId);
    let amountLabel = "";
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.amount_total) {
        const v = session.amount_total / 100;
        const cur = (session.currency ?? "usd").toUpperCase();
        success.searchParams.set("v", String(v));
        success.searchParams.set("cur", cur);
        amountLabel = `${v} ${cur}`;
      }

      // Affiliate commission for the referrer (idempotent per invoice). The
      // Stripe webhook normally does this, but test mode has no webhook delivery
      // — without this the referrer never sees the first-payment commission.
      // Renewals are covered by the invoice.payment_succeeded webhook in prod.
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription?.id ?? "");
      const invoiceId =
        typeof session.invoice === "string" ? session.invoice : (session.invoice?.id ?? null);
      await recordAffiliateCommission({
        customerUserId: user.id,
        saleAmount: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "usd").toUpperCase(),
        externalRef: invoiceId,
        subscriptionId: subId,
      });
    } catch {
      // Value lookup / commission is best-effort; still redirect with the order id.
    }

    // Notify the backoffice of the payment.
    await recordAdminEvent({
      type: "payment_success",
      title: `Thanh toán VIP: ${user.email ?? user.id.slice(0, 8)}`,
      message: amountLabel ? `Số tiền ${amountLabel}` : "Nâng cấp VIP thành công",
      metadata: { userId: user.id, sessionId },
    });

    // Confirm to the buyer in-app + by email (best-effort).
    await notifyUser(user.id, {
      title: "Nâng cấp VIP thành công 🎉",
      body: "Cảm ơn bạn! Gói VIP đã kích hoạt — 3 EA và Kho EA đã mở khóa.",
      level: "success",
      href: "/dashboard/kho",
    });
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Xác nhận nâng cấp VIP — Dralvo",
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0e1116">Cảm ơn bạn đã nâng cấp VIP 🎉</h2>
          <p>Thanh toán${amountLabel ? ` <b>${amountLabel}</b>` : ""} đã thành công. Gói VIP của <b>${user.email}</b> đã được kích hoạt.</p>
          <p>Bạn đã mở khóa toàn bộ EA (GoldMaster, GoldScalp, TiGold) và Kho EA.</p>
          <p><a href="https://www.dralvo.com/dashboard/kho" style="display:inline-block;background:#F0B90B;color:#060609;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Mở Kho EA</a></p>
        </div>`,
      });
    }

    return NextResponse.redirect(success.toString());
  } catch (syncError) {
    console.error("[Stripe Checkout Success] Sync failed:", syncError);
    return NextResponse.redirect(`${origin}/dashboard?checkout=sync_failed`);
  }
}
