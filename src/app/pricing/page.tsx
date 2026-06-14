"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, QrCode, Shield, CreditCard, RefreshCw, HelpCircle } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SiteFooter } from "@/components/shared/site-footer";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { PRICING_COPY, PRODUCT_COPY, type SupportedLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Scroll-reveal hook                                                        */
/* -------------------------------------------------------------------------- */

function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* -------------------------------------------------------------------------- */
/*  FAQ Data                                                                  */
/* -------------------------------------------------------------------------- */

type VietQrPayment = {
  reference: string;
  amountVnd: number;
  addInfo: string;
  accountName: string;
  accountNo: string;
  bankBin: string;
  qrDataUrl: string | null;
  expiresAt: string;
};

type VietQrStatus = "pending" | "confirmed" | "expired" | "canceled";

type CheckoutNoticeKind = "cancelled" | "error";

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { ref, visible } = useScrollReveal(0.1);
  const faqId = useId();
  const buttonId = `${faqId}-button`;
  const panelId = `${faqId}-panel`;

  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border rounded-xl overflow-hidden transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        open && "border-border-gold",
      )}
    >
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="font-display text-lg text-text-primary group-hover:text-gold transition-colors pr-4">
          {question}
        </span>
        <span
          className={cn(
            "shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gold transition-all duration-300",
            open
              ? "bg-gold/10 border-border-gold rotate-45"
              : "group-hover:border-border-gold group-hover:bg-gold/5",
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-300"
          >
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Pricing Page                                                         */
/* -------------------------------------------------------------------------- */

export default function PricingPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const localized = PRODUCT_COPY[locale];
  const pageCopy = PRICING_COPY[locale];
  const [scrolled, setScrolled] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [vietQrEnabled, setVietQrEnabled] = useState(false);
  const [vietQrLoading, setVietQrLoading] = useState(false);
  const [vietQrError, setVietQrError] = useState<string | null>(null);
  const [vietQrPayment, setVietQrPayment] = useState<VietQrPayment | null>(null);
  const [vietQrStatus, setVietQrStatus] = useState<VietQrStatus | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<CheckoutNoticeKind | null>(null);

  /* ---- scroll detection for nav ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkVietQr() {
      try {
        const res = await fetch("/api/vietqr/payment-request");
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setVietQrEnabled(Boolean(body.enabled));
      } catch {
        // VietQR is optional and configured through server env.
      }
    }

    checkVietQr();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "cancelled" || checkout === "error") {
      setCheckoutNotice(checkout);
    }
  }, []);

  /* ---- check auth state ---- */
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;

        if (user) {
          // Try to get subscription tier
          try {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("plan_tier, status")
              .eq("user_id", user.id)
              .single();

            if (sub && (sub.status === "active" || sub.status === "trialing")) {
              setUserPlan(sub.plan_tier);
            } else {
              setUserPlan("Free");
            }
          } catch {
            setUserPlan("Free");
          }
        }
      } catch {
        // Not logged in
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  /* ---- Stripe checkout handler ---- */
  const handleUpgrade = useCallback(async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.push(`/signup?redirect=${encodeURIComponent("/api/stripe/checkout?intent=pro")}`);
          return;
        }
        throw new Error(body.error || "Failed to start checkout");
      }

      const { url } = await res.json();
      if (!url) throw new Error("No checkout URL returned");

      window.location.href = url;
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setCheckoutLoading(false);
    }
  }, [router]);

  const handleVietQrPayment = useCallback(async () => {
    setVietQrLoading(true);
    setVietQrError(null);

    try {
      const res = await fetch("/api/vietqr/payment-request", { method: "POST" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.push("/signup");
          return;
        }
        throw new Error(body.error || "Failed to create VietQR payment");
      }

      const body = await res.json();
      setVietQrPayment(body.payment);
      setVietQrStatus("pending");
    } catch (err) {
      setVietQrError(
        err instanceof Error ? err.message : "Không tạo được mã VietQR. Vui lòng thử lại.",
      );
    } finally {
      setVietQrLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!vietQrPayment || vietQrStatus !== "pending") return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function checkStatus() {
      try {
        const res = await fetch(
          `/api/vietqr/payment-request?reference=${encodeURIComponent(vietQrPayment!.reference)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const body = await res.json();
          if (cancelled) return;

          const status = body.payment?.status as VietQrStatus | undefined;
          if (status) {
            setVietQrStatus(status);
            if (status === "confirmed") {
              setUserPlan("Pro");
              return;
            }
          }
        }
      } catch {
        // A transient polling failure should not invalidate the QR request.
      }

      if (!cancelled) timeout = setTimeout(checkStatus, 5_000);
    }

    timeout = setTimeout(checkStatus, 3_000);

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [vietQrPayment, vietQrStatus]);

  return (
    <div className="min-h-screen bg-deep text-text-primary overflow-x-hidden">
      {/* Gold vein decorative lines */}
      <div className="gold-veins fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="v1" />
        <div className="v2" />
        <div className="v3" />
        <div className="h1" />
        <div className="h2" />
      </div>

      {/* ── NAV ── */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-deep/80 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(212,168,67,0.05)]"
            : "bg-transparent",
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-4">
            <Link
              href="/methodology"
              className="text-sm text-text-secondary hover:text-gold transition-colors no-underline tracking-[0.02em]"
            >
              {pageCopy.methodology}
            </Link>
            <Link
              href="/login"
              className="hidden text-sm text-text-secondary hover:text-gold transition-colors no-underline tracking-[0.02em] sm:inline"
            >
              {pageCopy.signIn}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gold-action px-4 py-2 text-sm font-semibold text-[#060609] no-underline transition-colors hover:bg-gold-actionHover"
            >
              {localized.primaryCta}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main>
        {/* ═══════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════ */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[700px] h-[700px] -top-40 -right-40" />
          <GlowOrb className="w-[500px] h-[500px] -bottom-20 -left-20" />

          <div className="max-w-[900px] mx-auto px-6 relative z-10 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-border-gold rounded-full text-[11px] tracking-[0.15em] uppercase text-gold mb-8 bg-gold/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-shimmer" />
              {pageCopy.eyebrow}
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-[-0.02em] text-text-primary mb-6">
              {pageCopy.title}
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-[620px] mx-auto mb-4">
              {pageCopy.promise}
            </p>

            <p className="text-sm text-text-muted leading-relaxed max-w-[560px] mx-auto">
              {pageCopy.detail}
            </p>

            {checkoutNotice && (
              <div className="mx-auto mt-8 max-w-[620px]">
                <CheckoutStatusNotice
                  title={
                    checkoutNotice === "cancelled"
                      ? pageCopy.checkoutNotice.cancelledTitle
                      : pageCopy.checkoutNotice.errorTitle
                  }
                  body={
                    checkoutNotice === "cancelled"
                      ? pageCopy.checkoutNotice.cancelledBody
                      : pageCopy.checkoutNotice.errorBody
                  }
                  tone={checkoutNotice === "cancelled" ? "neutral" : "error"}
                />
              </div>
            )}
          </div>
        </section>

        {/* Pricing cards */}
        <section className="relative pb-24">
          <GlowOrb className="w-[400px] h-[400px] top-0 right-0" />

          <div className="max-w-[1000px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[1fr_1fr] gap-6 max-lg:grid-cols-1 max-w-[860px] mx-auto">
              {/* ── Free Card ── */}
              <PricingCard
                name={pageCopy.freeName}
                price={pageCopy.freePrice}
                period={pageCopy.freePeriod}
                description={pageCopy.freeDescription}
                features={pageCopy.freeFeatures}
                ctaLabel={
                  checkingAuth
                    ? pageCopy.redirecting
                    : userPlan === "Free"
                    ? pageCopy.currentPlan
                    : pageCopy.getStarted
                }
                ctaHref="/signup"
                ctaDisabled={checkingAuth || userPlan === "Free"}
                highlighted={false}
                delay={0}
              />

              {/* ── Pro Card ── */}
              <PricingCard
                name={pageCopy.proName}
                price={pageCopy.proPrice}
                period={pageCopy.proPeriod}
                description={pageCopy.proDescription}
                features={pageCopy.proFeatures}
                ctaLabel={
                  checkoutLoading
                    ? pageCopy.redirecting
                    : checkingAuth
                      ? pageCopy.redirecting
                      : userPlan === "Pro"
                      ? pageCopy.currentPlan
                      : pageCopy.upgrade
                }
                ctaLoading={checkoutLoading}
                ctaDisabled={checkingAuth || userPlan === "Pro" || checkoutLoading}
                ctaError={checkoutError}
                onCta={userPlan === "Pro" ? undefined : handleUpgrade}
                highlighted={true}
                badge={pageCopy.popular}
                delay={100}
                featureHighlights={[0, 1, 2, 3]}
              />
            </div>

            {/* Trust strip */}
            <div className="mt-12 flex items-center justify-center gap-8 text-text-muted">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold-dim" />
                <span className="text-xs">{pageCopy.trust[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold-dim" />
                <span className="text-xs">{pageCopy.trust[1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gold-dim" />
                <span className="text-xs">{pageCopy.trust[2]}</span>
              </div>
              {vietQrEnabled && (
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-gold-dim" />
                  <span className="text-xs">{pageCopy.trust[3]}</span>
                </div>
              )}
            </div>

            <div className="mt-8 max-w-[860px] mx-auto">
              <VietQrPaymentPanel
                locale={locale}
                copy={pageCopy.vietQr}
                enabled={vietQrEnabled}
                loading={vietQrLoading}
                error={vietQrError}
                payment={vietQrPayment}
                status={vietQrStatus}
                onCreate={handleVietQrPayment}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ
            ═══════════════════════════════════════════ */}
        <section className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] -bottom-40 -right-40" />
          <div className="max-w-[760px] mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                {pageCopy.faqTitle}
              </h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">
                {pageCopy.faqSubtitle}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {pageCopy.faq.map(([question, answer], i) => (
                <FaqItem key={question} question={question} answer={answer} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            BOTTOM CTA
            ═══════════════════════════════════════════ */}
        <section className="py-16 border-t border-border">
          <div className="max-w-[600px] mx-auto px-6 text-center">
            <p className="text-text-secondary mb-6">
              {pageCopy.ready}
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-gold-action text-[#060609] rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-actionHover transition-all duration-300 hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)] no-underline"
              >
                {localized.primaryCta}
              </Link>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={checkingAuth || checkoutLoading || userPlan === "Pro"}
                className="px-8 py-3.5 border border-border-gold text-gold rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingAuth || checkoutLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {pageCopy.redirecting}
                  </span>
                ) : (
                  pageCopy.goPro
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DISCLAIMER
            ═══════════════════════════════════════════ */}
        <section className="py-12 border-t border-border">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <p className="text-sm leading-relaxed text-text-muted">
              {localized.disclaimer}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function CheckoutStatusNotice({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "neutral" | "error";
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border px-5 py-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)]",
        tone === "error"
          ? "border-red/30 bg-red/10"
          : "border-border-gold bg-gold/10",
      )}
    >
      <p className="font-display text-lg text-text-primary">{title}</p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">{body}</p>
    </div>
  );
}

function formatVnd(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function VietQrPaymentPanel({
  locale,
  copy,
  enabled,
  loading,
  error,
  payment,
  status,
  onCreate,
}: {
  locale: SupportedLocale;
  copy: Record<string, string>;
  enabled: boolean;
  loading: boolean;
  error: string | null;
  payment: VietQrPayment | null;
  status: VietQrStatus | null;
  onCreate: () => void;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-surface/80 p-6 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-gold">
            <QrCode className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              {copy.eyebrow}
            </span>
          </div>
          <h3 className="font-display text-2xl text-text-primary">
            {copy.title}
          </h3>
          <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-text-secondary">
            {copy.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={!enabled || loading}
          className="rounded-xl border border-border-gold px-5 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? copy.creating : enabled ? copy.create : copy.unavailable}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      {payment && (
        <div className="mt-6">
          <div
            role="status"
            className={cn(
              "mb-5 rounded-xl border px-4 py-3 text-sm",
              status === "confirmed"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : status === "expired" || status === "canceled"
                  ? "border-red/30 bg-red/10 text-red"
                  : "border-border-gold bg-gold/5 text-text-secondary",
            )}
          >
            {status === "confirmed"
              ? copy.confirmed
              : status === "expired" || status === "canceled"
                ? copy.notCompleted
                : copy.waiting}
          </div>
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <div className="rounded-xl border border-border bg-deep/40 p-3">
              {payment.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={payment.qrDataUrl}
                  alt={`VietQR payment ${payment.reference}`}
                  className="h-auto w-full rounded-lg bg-white"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-deep text-sm text-text-muted">
                  {copy.qrUnavailable}
                </div>
              )}
            </div>
            <div className="grid gap-3 text-sm">
              <PaymentField label={copy.amount} value={formatVnd(payment.amountVnd, locale)} strong />
              <PaymentField label={copy.transferContent} value={payment.addInfo} strong />
              <PaymentField label={copy.reference} value={payment.reference} />
              <PaymentField label={copy.accountName} value={payment.accountName} />
              <PaymentField label={copy.accountNo} value={payment.accountNo} />
              <PaymentField label={copy.bankBin} value={payment.bankBin} />
              <p className="text-xs leading-relaxed text-text-muted">
                {copy.expiresPrefix}{" "}
                {new Date(payment.expiresAt).toLocaleString(locale === "pt-BR" ? "pt-BR" : locale)}.
                {" "}{copy.expiresSuffix}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentField({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-deep/30 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.12em] text-text-muted">{label}</div>
      <div className={cn("mt-1 break-all text-text-secondary", strong && "font-semibold text-text-primary")}>
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PricingCard                                                               */
/* -------------------------------------------------------------------------- */

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  ctaLabel,
  ctaHref,
  ctaLoading = false,
  ctaDisabled = false,
  ctaError,
  onCta,
  highlighted = false,
  badge,
  delay = 0,
  featureHighlights = [],
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  ctaError?: string | null;
  onCta?: () => void;
  highlighted?: boolean;
  badge?: string;
  delay?: number;
  featureHighlights?: number[];
}) {
  const { ref, visible } = useScrollReveal(0.1);

  const CtaButton = ctaHref && !ctaDisabled ? (
    <Link
      href={ctaHref}
      className={cn(
        "block w-full py-3.5 rounded-xl text-sm font-semibold tracking-[0.03em] transition-all duration-300 text-center no-underline",
        highlighted
          ? "bg-gold-action text-[#060609] hover:bg-gold-actionHover hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)]"
          : ctaDisabled
            ? "bg-gold/10 text-gold cursor-default"
            : "border border-border-gold text-gold hover:bg-gold/10",
      )}
    >
      {ctaLabel}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onCta}
      disabled={ctaDisabled}
      className={cn(
        "w-full py-3.5 rounded-xl text-sm font-semibold tracking-[0.03em] transition-all duration-300 flex items-center justify-center gap-2",
        highlighted
          ? "bg-gold-action text-[#060609] hover:bg-gold-actionHover hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)] disabled:bg-gold-action/40 disabled:text-[#060609]/60 disabled:cursor-not-allowed disabled:shadow-none"
          : ctaDisabled
            ? "bg-gold/10 text-gold cursor-default"
            : "border border-border-gold text-gold hover:bg-gold/10",
      )}
    >
      {ctaLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {ctaLabel}
    </button>
  );

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-surface border rounded-2xl p-8 transition-all duration-700 flex flex-col",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        highlighted
          ? "border-gold/40 bg-gradient-to-b from-gold/5 to-surface shadow-[0_0_60px_rgba(212,168,67,0.08)]"
          : "border-border hover:border-border-gold",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gold top accent line for Pro */}
      {highlighted && (
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold-action text-[#060609] text-[11px] font-semibold rounded-full tracking-[0.05em] shadow-[0_4px_16px_rgba(212,168,67,0.3)]">
          {badge}
        </div>
      )}

      {/* Plan name */}
      <h2 className="font-display text-2xl text-text-primary mb-2">{name}</h2>

      {/* Price */}
      <div className="mb-3">
        <span className="font-mono text-5xl font-semibold text-text-primary tracking-[-0.02em]">
          {price}
        </span>
        <span className="text-text-muted text-sm ml-1.5">{period}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary leading-relaxed mb-8">{description}</p>

      {/* Feature list */}
      <ul className="space-y-3.5 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check
              className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                featureHighlights.includes(i) ? "text-gold-bright" : "text-gold-dim",
              )}
            />
            <span
              className={cn(
                "text-text-secondary",
                featureHighlights.includes(i) && "text-text-primary font-medium",
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="space-y-2">
        {CtaButton}
        {ctaError && (
          <p className="text-xs text-red text-center">{ctaError}</p>
        )}
      </div>
    </div>
  );
}
