import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  hasProAccess,
  upsertProSubscriptionFromCheckoutSession,
} from "@/lib/stripe-subscriptions";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const startedAtMs = Date.now();
  const startedAt = new Date().toISOString();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.error("[Stripe Webhook] Supabase admin client not configured.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await upsertProSubscriptionFromCheckoutSession(session);

        // ponytail: auto-generate license key for Unlimited buyers
        const userId = session.client_reference_id;
        if (userId) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("current_period_end")
            .eq("user_id", userId)
            .single();
          await supabase.from("license_keys").upsert({
            user_id: userId,
            plan: "unlimited",
            expires_at: sub?.current_period_end ?? null,
          }, { onConflict: "user_id" });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;
        const status = subscription.status;
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status,
            plan: hasProAccess(status) ? "pro" : "free",
            plan_tier: hasProAccess(status) ? "Pro" : "Free",
            current_period_end: currentPeriodEnd,
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        if (error) {
          console.error(
            "[Stripe Webhook] Failed to update subscription:",
            error,
          );
        }

        // ponytail: sync license expiry on renewal / status change
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();
        if (subRow) {
          await supabase.from("license_keys")
            .update({ expires_at: currentPeriodEnd })
            .eq("user_id", subRow.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            plan_tier: "Free",
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        if (error) {
          console.error(
            "[Stripe Webhook] Failed to mark subscription as canceled:",
            error,
          );
        }

        // ponytail: revoke license on cancel
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();
        if (subRow) {
          await supabase.from("license_keys")
            .delete()
            .eq("user_id", subRow.user_id);
        }
        break;
      }

      default:
        // Unhandled event type: log for observability but do not fail.
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    await recordRunLog({
      runType: "stripe_webhook",
      status: "success",
      startedAt,
      durationMs: Date.now() - startedAtMs,
      metadata: {
        event_id: event.id,
        event_type: event.type,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Unexpected error:", error);
    await recordRunLog({
      runType: "stripe_webhook",
      status: "error",
      startedAt,
      durationMs: Date.now() - startedAtMs,
      metadata: {
        event_id: event.id,
        event_type: event.type,
      },
      error: error instanceof Error ? error.message : "Webhook processing failed.",
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}

