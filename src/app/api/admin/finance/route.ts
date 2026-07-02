/**
 * GET /api/admin/finance
 * Revenue dashboard: payments in a date range, each tagged with the customer's
 * acquisition source (affiliate / partner / direct). Returns the full range
 * (capped) so the client can search + export CSV.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can, batchGetEmails } from "@/lib/admin/auth";
import { getStripe } from "@/lib/stripe";

const round2 = (n: number) => Math.round(n * 100) / 100;

interface Payment {
  id: string;
  date: string;
  user_id: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
  source: string;        // "Affiliate · CODE" | "Partner · Name" | "Trực tiếp"
  sourceType: "affiliate" | "partner" | "direct";
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "finance.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
    const fromISO = `${from}T00:00:00Z`;
    const toISO = `${to}T23:59:59Z`;

    const { data: subs } = await client
      .from("subscriptions")
      .select("id, user_id, status, created_at, stripe_customer_id")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false })
      .limit(2000);

    const rows = subs ?? [];
    const userIds = rows.map((s) => s.user_id as string);
    const emails = await batchGetEmails(client, userIds);

    // Resolve acquisition source via profiles.referrer_type/referrer_id.
    const sourceByUser = new Map<string, { source: string; sourceType: Payment["sourceType"] }>();
    if (userIds.length) {
      const { data: profs } = await client
        .from("profiles")
        .select("id, referrer_type, referrer_id")
        .in("id", userIds);
      const affIds = [...new Set((profs ?? []).filter((p) => p.referrer_type === "affiliate" && p.referrer_id).map((p) => p.referrer_id))];
      const partnerIds = [...new Set((profs ?? []).filter((p) => p.referrer_type === "partner" && p.referrer_id).map((p) => p.referrer_id))];

      const affMap = new Map<string, string>();
      if (affIds.length) {
        const { data: affs } = await client.from("affiliates").select("id, code").in("id", affIds);
        (affs ?? []).forEach((a) => affMap.set(a.id as string, a.code as string));
      }
      const partnerMap = new Map<string, string>();
      if (partnerIds.length) {
        const { data: parts } = await client.from("partners").select("id, code, name").in("id", partnerIds);
        (parts ?? []).forEach((p) => partnerMap.set(p.id as string, (p.name as string) || (p.code as string)));
      }

      for (const p of profs ?? []) {
        if (p.referrer_type === "affiliate" && p.referrer_id) {
          sourceByUser.set(p.id as string, { source: `Affiliate · ${affMap.get(p.referrer_id) ?? "?"}`, sourceType: "affiliate" });
        } else if (p.referrer_type === "partner" && p.referrer_id) {
          sourceByUser.set(p.id as string, { source: `Partner · ${partnerMap.get(p.referrer_id) ?? "?"}`, sourceType: "partner" });
        }
      }
    }

    // Real amount paid per customer — from Stripe invoices in range (Stripe 22.x
    // dropped invoice.subscription, so we key by the stable customer id). This
    // replaces the old flat $59 so 6-month / 1-year plans log their true price.
    const amountByCustomer = new Map<string, { amount: number; currency: string }>();
    try {
      const stripe = getStripe();
      const gte = Math.floor(new Date(fromISO).getTime() / 1000);
      const lte = Math.floor(new Date(toISO).getTime() / 1000);
      let startingAfter: string | undefined;
      for (let page = 0; page < 10; page++) {
        const batch = await stripe.invoices.list({
          created: { gte, lte },
          status: "paid",
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        for (const inv of batch.data) {
          // Totals are reported in USD — skip non-USD invoices rather than
          // summing raw amounts across currencies into a single "USD" figure.
          if ((inv.currency ?? "usd") !== "usd") continue;
          const cust = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
          if (!cust) continue;
          const prev = amountByCustomer.get(cust);
          amountByCustomer.set(cust, {
            amount: (prev?.amount ?? 0) + (inv.amount_paid ?? 0) / 100,
            currency: (inv.currency ?? "usd").toUpperCase(),
          });
        }
        if (!batch.has_more) break;
        startingAfter = batch.data[batch.data.length - 1]?.id;
        if (!startingAfter) break;
      }
    } catch (e) {
      console.error("[Admin Finance] invoice amounts", e);
    }

    const payments: Payment[] = rows.map((s) => {
      const src = sourceByUser.get(s.user_id as string);
      const paid = s.stripe_customer_id ? amountByCustomer.get(s.stripe_customer_id as string) : undefined;
      return {
        id: s.id as string,
        date: s.created_at as string,
        user_id: s.user_id as string,
        email: emails.get(s.user_id as string) ?? null,
        amount: round2(paid?.amount ?? 0), // real Stripe amount; 0 if no paid invoice (e.g. comp/demo)
        currency: paid?.currency ?? "USD",
        status: s.status as string,
        source: src?.source ?? "Trực tiếp",
        sourceType: src?.sourceType ?? "direct",
      };
    });

    const stripeTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    // ---- Cashflow / ROI summary ----------------------------------------
    // Real gross + Stripe fees come from Stripe balance transactions.
    const fromUnix = Math.floor(new Date(fromISO).getTime() / 1000);
    const toUnix = Math.floor(new Date(toISO).getTime() / 1000);

    let grossUSD = 0;
    let feesUSD = 0;
    let stripeNetUSD = 0;
    let chargeCount = 0;
    let capped = false;

    try {
      const stripe = getStripe();
      const MAX_PAGES = 10;
      let startingAfter: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await stripe.balanceTransactions.list({
          created: { gte: fromUnix, lte: toUnix },
          type: "charge",
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        for (const txn of batch.data) {
          if ((txn.currency ?? "usd") !== "usd") continue; // USD-only totals
          grossUSD += txn.amount / 100;
          feesUSD += txn.fee / 100;
          stripeNetUSD += txn.net / 100;
          chargeCount++;
        }
        if (!batch.has_more) break;
        startingAfter = batch.data[batch.data.length - 1]?.id;
        if (!startingAfter) break;
        if (page === MAX_PAGES - 1) capped = true;
      }
    } catch (stripeErr) {
      console.error("[Admin Finance] Stripe cashflow failed", stripeErr);
      grossUSD = 0;
      feesUSD = 0;
      stripeNetUSD = 0;
      chargeCount = 0;
      capped = false;
    }

    // Partner commissions in range.
    let partnerUSD = 0;
    {
      const { data: pc } = await client
        .from("partner_commissions")
        .select("commission_amount")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);
      partnerUSD = (pc ?? []).reduce((s, r) => s + (Number(r.commission_amount) || 0), 0);
    }

    // Affiliate commissions in range (exclude cancelled / refunded).
    let affiliateUSD = 0;
    {
      const { data: ac } = await client
        .from("affiliate_commissions")
        .select("amount, status")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .not("status", "in", "(cancelled,refunded)");
      affiliateUSD = (ac ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    }

    const retainedUSD = stripeNetUSD - partnerUSD - affiliateUSD;
    const marginPct = grossUSD ? (retainedUSD / grossUSD) * 100 : 0;

    const cashflow = {
      grossUSD: round2(grossUSD),
      feesUSD: round2(feesUSD),
      stripeNetUSD: round2(stripeNetUSD),
      partnerUSD: round2(partnerUSD),
      affiliateUSD: round2(affiliateUSD),
      retainedUSD: round2(retainedUSD),
      marginPct: Math.round(marginPct * 10) / 10,
      chargeCount,
      capped,
    };

    return NextResponse.json({
      payments,
      total: payments.length,
      totals: { stripeUSD: stripeTotal },
      cashflow,
      range: { from, to },
    });
  } catch (e) {
    console.error("[Admin Finance]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
