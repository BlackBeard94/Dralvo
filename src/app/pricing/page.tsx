"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, QrCode, Shield, CreditCard, RefreshCw, ChevronRight } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { PRICING_COPY, PRODUCT_COPY, type SupportedLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Scroll reveal                                                             */
/* -------------------------------------------------------------------------- */

function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* -------------------------------------------------------------------------- */
/*  Color opacity helpers (Tailwind 3 + CSS var hex limitation)                */
/* -------------------------------------------------------------------------- */

const alpha = {
  green: (a: number) => `rgba(59,168,126,${a})`,
  red: (a: number) => `rgba(232,72,59,${a})`,
  gold: (a: number) => `rgba(212,168,67,${a})`,
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type VietQrPayment = {
  reference: string; amountVnd: number; addInfo: string;
  accountName: string; accountNo: string; bankBin: string;
  qrDataUrl: string | null; expiresAt: string;
};
type VietQrStatus = "pending" | "confirmed" | "expired" | "canceled";
type CheckoutNoticeKind = "cancelled" | "error";

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium border border-border text-text-muted mb-6"
      style={{ background: "rgba(26,26,42,0.4)" }}
    >{children}</div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const { ref, visible } = useScrollReveal(0.08);
  return (
    <div ref={ref} className={cn("border rounded-lg overflow-hidden transition-all duration-500", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5", open ? "border-gold/20" : "border-border")}
      style={{ background: open ? alpha.gold(0.05) : "transparent" }}
    >
      <button type="button" onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group">
        <span className={cn("text-sm font-medium transition-colors duration-200", open ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary")}>{question}</span>
        <span className="shrink-0 text-base transition-transform duration-300 font-light text-gold" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">{open && <p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">{answer}</p>}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkVietQr() {
      try { const res = await fetch("/api/vietqr/payment-request"); if (!res.ok) return; const body = await res.json(); if (!cancelled) setVietQrEnabled(Boolean(body.enabled)); } catch { /* optional */ }
    }
    checkVietQr();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "cancelled" || checkout === "error") setCheckoutNotice(checkout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user) {
          try {
            const { data: sub } = await supabase.from("subscriptions").select("plan_tier, status").eq("user_id", user.id).single();
            if (sub && (sub.status === "active" || sub.status === "trialing")) setUserPlan(sub.plan_tier);
            else setUserPlan("Free");
          } catch { setUserPlan("Free"); }
        }
      } catch { /* not logged in */ } finally { if (!cancelled) setCheckingAuth(false); }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  const handleUpgrade = useCallback(async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { router.push(`/signup?redirect=${encodeURIComponent("/api/stripe/checkout?intent=pro")}`); return; }
        throw new Error(body.error || "Failed to start checkout");
      }
      const { url } = await res.json();
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setCheckoutLoading(false);
    }
  }, [router]);

  const handleVietQrPayment = useCallback(async () => {
    setVietQrLoading(true);
    setVietQrError(null);
    try {
      const res = await fetch("/api/vietqr/payment-request", { method: "POST" });
      if (!res.ok) { const body = await res.json().catch(() => ({})); if (res.status === 401) { router.push("/signup"); return; } throw new Error(body.error || "Failed to create VietQR payment"); }
      const body = await res.json();
      setVietQrPayment(body.payment);
      setVietQrStatus("pending");
    } catch (err) {
      setVietQrError(err instanceof Error ? err.message : "Không tạo được mã VietQR. Vui lòng thử lại.");
    } finally { setVietQrLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!vietQrPayment || vietQrStatus !== "pending") return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    async function checkStatus() {
      try {
        const res = await fetch(`/api/vietqr/payment-request?reference=${encodeURIComponent(vietQrPayment!.reference)}`, { cache: "no-store" });
        if (res.ok) { const body = await res.json(); if (cancelled) return; const status = body.payment?.status as VietQrStatus | undefined; if (status) { setVietQrStatus(status); if (status === "confirmed") { setUserPlan("Pro"); return; } } }
      } catch { /* transient */ }
      if (!cancelled) timeout = setTimeout(checkStatus, 5_000);
    }
    timeout = setTimeout(checkStatus, 3_000);
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); };
  }, [vietQrPayment, vietQrStatus]);

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" />
        <div className="h1" /><div className="h2" />
      </div>

      {/* Nav — đồng bộ với landing */}
      <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", scrolled ? "bg-deep/85 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(212,168,67,0.04)]" : "bg-transparent")}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/#evidence" className="hidden sm:inline text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline px-2">Bằng chứng</Link>
            <Link href="/#algorithm" className="hidden sm:inline text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline px-2">Thuật toán</Link>
            <Link href="/#results" className="hidden sm:inline text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline px-2">Kết quả</Link>
            <Link href="/pricing" className="hidden sm:inline text-[13px] tracking-[0.03em] text-gold transition-colors no-underline px-2 font-medium">Bảng giá</Link>
            <Link href="/login" className="hidden md:inline text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline px-2">Đăng nhập</Link>
            <Link href={userPlan === "Pro" ? "/dashboard" : "/signup"} className="ml-1 rounded-md bg-gold-action px-4 py-2 text-[13px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:bg-gold-actionHover hover:scale-[1.03]">
              {userPlan === "Pro" ? "Dashboard" : localized.primaryCta}
            </Link>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative pt-32 pb-16 lg:pb-24 px-6 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[900px] h-[700px] -top-80 -right-40" />
          <GlowOrb className="w-[500px] h-[500px] -bottom-20 -left-20" />
          <div className="max-w-[860px] mx-auto relative z-10 text-center">
            <SectionTag>{pageCopy.eyebrow}</SectionTag>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-[-0.015em] mb-5 text-balance" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
              {pageCopy.title}
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-[620px] mx-auto mb-3">{pageCopy.promise}</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-[560px] mx-auto">{pageCopy.detail}</p>
            {checkoutNotice && (
              <div className="mx-auto mt-8 max-w-[620px]">
                <CheckoutStatusNotice title={checkoutNotice === "cancelled" ? pageCopy.checkoutNotice.cancelledTitle : pageCopy.checkoutNotice.errorTitle}
                  body={checkoutNotice === "cancelled" ? pageCopy.checkoutNotice.cancelledBody : pageCopy.checkoutNotice.errorBody}
                  tone={checkoutNotice === "cancelled" ? "neutral" : "error"} />
              </div>
            )}
          </div>
        </section>

        {/* Pricing cards */}
        <section className="relative pb-20 lg:pb-28 px-6">
          <GlowOrb className="w-[400px] h-[400px] top-0 right-0 opacity-50" />
          <div className="max-w-[1000px] mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[860px] mx-auto">
              <PricingCard name={pageCopy.freeName} price={pageCopy.freePrice} period={pageCopy.freePeriod}
                description={pageCopy.freeDescription} features={pageCopy.freeFeatures}
                ctaLabel={checkingAuth ? pageCopy.redirecting : userPlan === "Free" ? pageCopy.currentPlan : pageCopy.getStarted}
                ctaHref="/signup" ctaDisabled={checkingAuth || userPlan === "Free"} highlighted={false} delay={0} />

              <PricingCard name={pageCopy.proName} price={pageCopy.proPrice} period={pageCopy.proPeriod}
                description={pageCopy.proDescription} features={pageCopy.proFeatures}
                ctaLabel={checkoutLoading ? pageCopy.redirecting : checkingAuth ? pageCopy.redirecting : userPlan === "Pro" ? pageCopy.currentPlan : pageCopy.upgrade}
                ctaLoading={checkoutLoading} ctaDisabled={checkingAuth || userPlan === "Pro" || checkoutLoading}
                ctaError={checkoutError} onCta={userPlan === "Pro" ? undefined : () => setShowPaymentModal(true)}
                highlighted={true} badge={pageCopy.popular} delay={100} featureHighlights={[0, 1, 2, 3]} />
            </div>

            {/* Trust strip */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-text-muted">
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-gold-dim" /><span className="text-xs">{pageCopy.trust[0]}</span></div>
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gold-dim" /><span className="text-xs">{pageCopy.trust[1]}</span></div>
              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-gold-dim" /><span className="text-xs">{pageCopy.trust[2]}</span></div>
              {vietQrEnabled && <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-gold-dim" /><span className="text-xs">{pageCopy.trust[3]}</span></div>}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-20 lg:py-28 px-6 bg-surface">
          <div className="max-w-[760px] mx-auto relative z-10">
            <div className="text-center mb-14">
              <SectionTag>FAQ</SectionTag>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.1] tracking-[-0.015em] mb-4" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
                {pageCopy.faqTitle}
              </h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">{pageCopy.faqSubtitle}</p>
            </div>
            <div className="flex flex-col gap-3">
              {(pageCopy.faq as [string, string][]).map(([question, answer]) => (
                <FaqItem key={question} question={question} answer={answer} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-20 lg:py-28 px-6 overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2 opacity-30" />
          <div className="max-w-[600px] mx-auto relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-normal leading-[1.1] tracking-[-0.015em] mb-5 text-balance" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
              {pageCopy.ready}
            </h2>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup" className="px-8 py-3.5 rounded-md text-[15px] font-semibold bg-gold-bright text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]">
                {localized.primaryCta}
              </Link>
              <button type="button" onClick={() => setShowPaymentModal(true)} disabled={checkingAuth || checkoutLoading || userPlan === "Pro"}
                className="px-8 py-3.5 rounded-md text-[15px] font-semibold border border-border text-text-primary no-underline transition-all duration-200 hover:border-gold/30 hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed">
                {checkingAuth || checkoutLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{pageCopy.redirecting}</span> : pageCopy.goPro}
              </button>
            </div>
            <p className="mt-10 text-[11px] text-text-muted max-w-[440px] mx-auto leading-relaxed">{localized.disclaimer}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <BrandLink logoSize={28} wordmarkClassName="text-base" />
            <div className="flex flex-wrap items-center gap-5 text-xs text-text-secondary">
              <Link href="/methodology" className="hover:text-gold transition-colors no-underline">Phương pháp</Link>
              <Link href="/pricing" className="hover:text-gold transition-colors no-underline">Bảng giá</Link>
              <Link href="/privacy" className="hover:text-gold transition-colors no-underline">Bảo mật</Link>
              <Link href="/terms" className="hover:text-gold transition-colors no-underline">Điều khoản</Link>
              <Link href="/disclaimer" className="hover:text-gold transition-colors no-underline">Miễn trừ trách nhiệm</Link>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-text-muted">© 2026 Dralvo. Không phải lời khuyên đầu tư.</p>
            <p className="text-[11px] text-text-muted">Past performance ≠ future results.</p>
          </div>
        </div>
      </footer>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => { setShowPaymentModal(false); setVietQrPayment(null); setVietQrStatus(null); setVietQrError(null); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-[460px] rounded-xl border bg-card p-6 shadow-2xl border-gold/20" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowPaymentModal(false); setVietQrPayment(null); setVietQrStatus(null); setVietQrError(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-gold/30 transition-all text-lg leading-none">×</button>

            {/* Nếu đã có QR payment, hiển thị chi tiết thanh toán */}
            {vietQrPayment ? (
              <>
                <h3 className="text-xl text-text-primary mb-1" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
                  Thanh toán qua VietQR
                </h3>
                <div className={cn("mb-4 rounded-lg border px-4 py-3 text-sm",
                  vietQrStatus === "confirmed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                  vietQrStatus === "expired" || vietQrStatus === "canceled" ? "border-red/30 bg-red/10 text-red" :
                  "border-gold/20 bg-gold/5 text-text-secondary")}>
                  {vietQrStatus === "confirmed" ? "✅ Thanh toán thành công! Đang kích hoạt Pro..." :
                   vietQrStatus === "expired" || vietQrStatus === "canceled" ? "⚠ Thanh toán chưa hoàn tất." :
                   "⏳ Đang chờ thanh toán... Quét mã QR bên dưới."}
                </div>
                {vietQrError && <p className="text-sm text-red mb-3">{vietQrError}</p>}
                <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                  <div className="rounded-lg border border-border bg-white p-2">
                    {vietQrPayment.qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- dynamic QR data URL, not optimizable by next/image
                      <img src={vietQrPayment.qrDataUrl} alt="VietQR" className="w-full rounded" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-sm text-text-muted">Đang tạo QR...</div>
                    )}
                  </div>
                  <div className="grid gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-deep/30 px-3 py-2">
                      <div className="text-text-muted">Số tiền</div>
                      <div className="font-semibold text-text-primary">{formatVnd(vietQrPayment.amountVnd, locale)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-deep/30 px-3 py-2">
                      <div className="text-text-muted">Nội dung CK</div>
                      <div className="font-semibold text-text-primary break-all">{vietQrPayment.addInfo}</div>
                    </div>
                    <p className="text-[10px] text-text-muted">Hết hạn: {new Date(vietQrPayment.expiresAt).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => { setVietQrPayment(null); setVietQrStatus(null); setVietQrError(null); }}
                  className="mt-4 w-full py-2.5 text-sm text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors">
                  ← Quay lại chọn phương thức
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl text-text-primary mb-1" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
                  Chọn phương thức thanh toán
                </h3>
                <p className="text-sm text-text-secondary mb-6">Nâng cấp lên Pro — $39/tháng. Hủy bất kỳ lúc nào.</p>

                {/* Stripe */}
                <button onClick={handleUpgrade} disabled={checkoutLoading}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 transition-all mb-3 text-left disabled:opacity-50">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <CreditCard size={20} className="text-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">Thẻ Visa / Mastercard</div>
                    <div className="text-xs text-text-muted">Thanh toán qua Stripe — bảo mật, tức thì</div>
                  </div>
                  {checkoutLoading ? <Loader2 size={16} className="animate-spin text-gold" /> : <ChevronRight />}
                </button>

                {/* VietQR */}
                {vietQrEnabled && (
                  <button onClick={handleVietQrPayment} disabled={vietQrLoading}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 transition-all text-left disabled:opacity-50">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                      <QrCode size={20} className="text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary text-sm">VietQR — Chuyển khoản</div>
                      <div className="text-xs text-text-muted">Quét mã QR qua app ngân hàng Việt Nam</div>
                    </div>
                    {vietQrLoading ? <Loader2 size={16} className="animate-spin text-gold" /> : <ChevronRight />}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CheckoutStatusNotice                                                      */
/* -------------------------------------------------------------------------- */

function CheckoutStatusNotice({ title, body, tone }: { title: string; body: string; tone: "neutral" | "error" }) {
  return (
    <div role="status" className={cn("rounded-xl border px-5 py-4 text-left", tone === "error" ? "border-red/30" : "border-gold/20")}
      style={{ background: tone === "error" ? alpha.red(0.1) : alpha.gold(0.1) }}>
      <p className="text-lg text-text-primary" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{title}</p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">{body}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  VietQrPaymentPanel                                                        */
/* -------------------------------------------------------------------------- */

function formatVnd(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function PaymentField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-deep/30 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.12em] text-text-muted">{label}</div>
      <div className={cn("mt-1 break-all text-text-secondary", strong && "font-semibold text-text-primary")}>{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PricingCard                                                               */
/* -------------------------------------------------------------------------- */

function PricingCard({ name, price, period, description, features, ctaLabel, ctaHref, ctaLoading = false, ctaDisabled = false, ctaError, onCta, highlighted = false, badge, delay = 0, featureHighlights = [] }: {
  name: string; price: string; period: string; description: string; features: string[];
  ctaLabel: string; ctaHref?: string; ctaLoading?: boolean; ctaDisabled?: boolean;
  ctaError?: string | null; onCta?: () => void; highlighted?: boolean; badge?: string;
  delay?: number; featureHighlights?: number[];
}) {
  const { ref, visible } = useScrollReveal(0.1);

  const CtaButton = ctaHref && !ctaDisabled ? (
    <Link href={ctaHref} className={cn("block w-full py-3.5 rounded-md text-sm font-semibold text-center no-underline transition-all duration-200",
      highlighted ? "bg-gold-bright text-[#060609] hover:scale-[1.02]" : ctaDisabled ? "bg-gold/10 text-gold cursor-default" : "border text-gold hover:bg-gold/10")}
      style={!highlighted && !ctaDisabled ? { borderColor: alpha.gold(0.2) } : undefined}>
      {ctaLabel}
    </Link>
  ) : (
    <button type="button" onClick={onCta} disabled={ctaDisabled}
      className={cn("w-full py-3.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200",
        highlighted ? "bg-gold-bright text-[#060609] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" :
        ctaDisabled ? "bg-gold/10 text-gold cursor-default" : "border text-gold hover:bg-gold/10")}
      style={!highlighted && !ctaDisabled ? { borderColor: alpha.gold(0.2) } : undefined}>
      {ctaLoading && <Loader2 className="w-4 h-4 animate-spin" />}{ctaLabel}
    </button>
  );

  return (
    <div ref={ref} className={cn("relative bg-card border rounded-xl p-8 transition-all duration-500 flex flex-col",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      highlighted ? "border-gold/20 shadow-[0_0_60px_rgba(212,168,67,0.06)]" : "border-border hover:border-gold/20")}
      style={{ transitionDelay: `${delay}ms`, background: highlighted ? `linear-gradient(to bottom, ${alpha.gold(0.06)}, var(--bg-card))` : undefined }}>
      {highlighted && <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />}
      {badge && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold-bright text-[#060609] text-[13px] font-semibold rounded-full tracking-[0.05em]">{badge}</div>}
      <h2 className="text-2xl text-text-primary mb-2" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{name}</h2>
      <div className="mb-3"><span className="font-mono text-5xl font-semibold text-text-primary tracking-[-0.02em]">{price}</span><span className="text-text-muted text-sm ml-1.5">{period}</span></div>
      <p className="text-sm text-text-secondary leading-relaxed mb-8">{description}</p>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check className={cn("w-4 h-4 mt-0.5 shrink-0", featureHighlights.includes(i) ? "text-gold-bright" : "text-gold-dim")} />
            <span className={cn("text-text-secondary", featureHighlights.includes(i) && "text-text-primary font-medium")}>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-2">{CtaButton}{ctaError && <p className="text-xs text-red text-center">{ctaError}</p>}</div>
    </div>
  );
}
