"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, CreditCard, Crown, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { planStatusLabel } from "@/lib/stripe-subscriptions";
import { isPaidTier, type PlanSource } from "@/lib/plan";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface UserMenuProps {
  userEmail: string;
  planTier: string;
  planStatus?: string;
  planSource?: PlanSource;
  badge?: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getInitial(email: string): string {
  return (email.charAt(0) ?? "?").toUpperCase();
}

function getPlanBadge(planTier: string, freeLabel: string, planStatus?: string) {
  if (isPaidTier(planTier)) {
    return {
      label: "Unlimited",
      className: "bg-gold/15 text-gold border-gold/30",
      icon: Crown,
    };
  }

  if (planStatus && planStatus !== "free") {
    return {
      label: planStatusLabel(planStatus),
      className: "bg-red/10 text-red border-red/25",
      icon: User,
    };
  }

  return {
    label: freeLabel,
    className: "bg-text-muted/10 text-text-muted border-text-muted/20",
    icon: User,
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function UserMenu({
  userEmail,
  planTier,
  planStatus = "free",
  planSource = "none",
  badge,
}: UserMenuProps) {
  const router = useRouter();
  const isPaid = isPaidTier(planTier);
  // Only Stripe-backed subscriptions expose the billing portal.
  const canManageBilling = planSource === "subscription";
  const [open, setOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].userMenu;

  const initial = getInitial(userEmail);
  const plan = getPlanBadge(planTier, copy.free, planStatus);
  const PlanIcon = plan.icon;

  /* ---- close on click outside ---- */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  /* ---- close on Escape ---- */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  /* ---- sign out ---- */
  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  /* ---- billing ---- */
  const handleBilling = useCallback(async () => {
    setOpen(false);
    setBillingError(null);

    if (!canManageBilling) {
      // License-based Unlimited → account settings; Free → pricing.
      router.push(isPaid ? "/dashboard/settings" : "/pricing");
      return;
    }

    setBillingLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.url) {
        throw new Error(body.error || copy.billingError);
      }

      window.location.href = body.url;
    } catch (error) {
      setBillingError(
        error instanceof Error ? error.message : copy.billingError,
      );
      setOpen(true);
    } finally {
      setBillingLoading(false);
    }
  }, [canManageBilling, copy.billingError, isPaid, router]);

  return (
    <div className="relative flex items-center">
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center gap-2 rounded-md px-2 py-1.5",
          "text-text-secondary hover:text-text-primary hover:bg-gold/5",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
          open && "bg-gold/5 text-text-primary",
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={copy.aria}
      >
        {/* Avatar circle */}
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 bg-gold/15 text-gold border border-gold/30"
          aria-hidden="true"
        >
          {initial}
        </span>

        {/* Email (hidden on small screens) */}
        <span className="hidden sm:block text-xs font-medium max-w-[120px] truncate">
          {userEmail}
        </span>

        <ChevronDown
          size={14}
          className={cn(
            "hidden sm:block text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        {badge}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute left-0 bottom-full mb-1.5 w-64 rounded-lg z-50",
            "bg-card border border-border",
            "shadow-xl shadow-black/40",
            "animate-in fade-in slide-in-from-top-2 duration-150",
          )}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">
              {userEmail}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold tracking-wider uppercase border",
                plan.className,
              )}
            >
              <PlanIcon size={10} />
              {plan.label}
            </span>
            <p className="mt-2 text-[13px] text-text-muted">
              {isPaid ? copy.activeSubscription : copy.upgradeDescription}
            </p>
          </div>

          {/* Actions */}
          <div className="py-1">
            {/* Billing — Stripe portal for subscribers, upgrade CTA for free users */}
            {(canManageBilling || !isPaid) && (
              <button
                type="button"
                role="menuitem"
                onClick={handleBilling}
                disabled={billingLoading}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-sm",
                  "text-text-secondary hover:text-text-primary hover:bg-gold/5",
                  "transition-colors duration-150 disabled:opacity-60 disabled:cursor-wait",
                )}
              >
                <CreditCard size={15} className="text-text-muted" />
                <span>
                  {canManageBilling
                    ? billingLoading
                      ? copy.openingBilling
                      : copy.manageBilling
                    : copy.upgrade}
                </span>
              </button>
            )}

            {billingError && (
              <p className="px-4 pb-2 text-xs text-red">
                {billingError}
              </p>
            )}

            {/* Sign out */}
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-sm",
                "text-text-secondary hover:text-red hover:bg-red/5",
                "transition-colors duration-150",
              )}
            >
              <LogOut size={15} className="text-text-muted" />
              <span>{copy.signOut}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
