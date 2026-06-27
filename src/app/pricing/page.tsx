"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { LANDING_COPY } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Constants (same as landing page)                                           */
/* -------------------------------------------------------------------------- */
const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";

const PERIODS = [
  { id: "monthly", months: 1 },
  { id: "sixmo", months: 6 },
  { id: "yearly", months: 12 },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

const UNLIMITED_PRICING: Record<PeriodId, { total: number; perMo: number; off: number }> = {
  monthly: { total: 59, perMo: 59, off: 0 },
  sixmo: { total: 319, perMo: 53, off: 10 },
  yearly: { total: 599, perMo: 50, off: 15 },
};

/* -------------------------------------------------------------------------- */
/*  Scroll reveal                                                              */
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
/*  Sub-components                                                             */
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
  return (
    <div className={cn("border rounded-lg overflow-hidden transition-colors duration-300", open ? "border-gold/25" : "border-border")}
      style={{ background: open ? "rgba(212,168,67,0.05)" : "transparent" }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group">
        <span className={cn("text-sm font-medium text-left", open ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary")}>{question}</span>
        <span className="shrink-0 text-base font-light text-gold transition-transform duration-300" style={{ transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">{open && <p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">{answer}</p>}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function PricingPage() {
  const { locale } = useLocale();
  const t = LANDING_COPY[locale];
  const p = t.pricing;
  const [scrolled, setScrolled] = useState(false);
  const [period, setPeriod] = useState<PeriodId>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const checkout = useCallback(
    async () => {
      setCheckoutLoading(true);
      setCheckoutError(null);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "unlimited", period }),
        });
        if (res.status === 401) { window.location.href = `/signup?redirect=pricing`; return; }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) { window.location.href = data.url; return; }
        setCheckoutError(data.error || "Không thể tạo phiên thanh toán. Vui lòng thử lại.");
      } catch {
        setCheckoutError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        if (!window.location.href.startsWith("http")) setCheckoutLoading(false);
      }
    },
    [period],
  );

  const unlimitedPrice = UNLIMITED_PRICING[period];

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" />
        <div className="h1" /><div className="h2" />
      </div>

      {/* Nav — đồng bộ với landing */}
      <nav className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-500", scrolled ? "bg-deep/85 backdrop-blur-xl border-b border-border" : "bg-transparent")}>
        <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/#products" className="hidden sm:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.products}</Link>
            <Link href="/#evidence" className="hidden sm:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.evidence}</Link>
            <Link href="/#fx-tool" className="hidden md:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.tools}</Link>
            <Link href="/tigold" className="hidden md:inline text-[13px] font-semibold hover:opacity-80 transition-colors no-underline px-2" style={{ color: "#00c98d" }}>{t.nav.tigold}</Link>
            <Link href="/pricing" className="hidden sm:inline text-[13px] text-gold transition-colors no-underline px-2 font-medium">{t.nav.pricing}</Link>
            <Link href="/login" className="hidden md:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.login}</Link>
            <Link href="/#pricing" className="ml-1 rounded-md bg-gold-action px-4 py-2 text-[13px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:bg-gold-actionHover hover:scale-[1.03]">{t.nav.cta}</Link>
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
            <SectionTag>{p.eyebrow}</SectionTag>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-[-0.015em] mb-5 text-balance" style={{ fontFamily: SERIF }}>
              {p.title}
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-[620px] mx-auto">{p.intro}</p>
          </div>
        </section>

        {/* Pricing — period selector + tiers */}
        <section className="relative pb-20 lg:pb-28 px-6">
          <GlowOrb className="w-[600px] h-[600px] top-10 left-1/2 -translate-x-1/2 opacity-40" />
          <div className="max-w-[1100px] mx-auto relative z-10">
            {/* Period toggle */}
            <div className="flex justify-center mb-9">
              <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
                {PERIODS.map((pr) => {
                  const on = period === pr.id;
                  const off = UNLIMITED_PRICING[pr.id].off;
                  return (
                    <button key={pr.id} type="button" aria-pressed={on} onClick={() => setPeriod(pr.id)}
                      className={cn("px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none flex items-center gap-1.5",
                        on ? "bg-gold text-[#060609]" : "bg-transparent text-text-muted hover:text-text-primary")}>
                      {p.periods[pr.id]}{off > 0 && <span className={cn("text-[10px] font-mono", on ? "text-[#060609]/70" : "text-green")}>−{off}%</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tier cards */}
            <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-[820px] mx-auto">
              {p.tiers.map((tier) => {
                const isFree = tier.id === "free";
                const popular = tier.id === "unlimited";
                return (
                  <PricingCard key={tier.id}
                    name={tier.name} tagline={tier.tagline} features={tier.features}
                    price={isFree ? 0 : unlimitedPrice.total}
                    perMo={!isFree && unlimitedPrice.off > 0 ? unlimitedPrice.perMo : undefined}
                    off={!isFree ? unlimitedPrice.off : undefined}
                    periodLabel={!isFree ? p.periods[period] : undefined}
                    perMonthLabel={p.perMonth}
                    cta={tier.cta}
                    popular={popular}
                    popularLabel={p.popular}
                    loading={!isFree && checkoutLoading}
                    onCta={isFree ? () => { window.location.href = "/tigold"; } : checkout}
                  />
                );
              })}
            </div>
            <p className="text-[12px] text-center text-text-muted mt-7">{p.cancelNote}</p>
            {checkoutError && <p role="alert" className="text-[12px] text-center text-red mt-2">{checkoutError}</p>}
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-20 lg:py-28 px-6 bg-surface">
          <div className="max-w-[760px] mx-auto relative z-10">
            <div className="text-center mb-14">
              <SectionTag>FAQ</SectionTag>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.1] tracking-[-0.015em] mb-4" style={{ fontFamily: SERIF }}>
                {t.faq.title}
              </h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">{t.faq.notFound}</p>
              <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors font-medium text-sm no-underline mt-3">
                {t.faq.telegram}<ArrowUpRight size={15} />
              </a>
            </div>
            <div className="flex flex-col gap-3">
              {t.faq.items.map(([q, a]) => (
                <FaqItem key={q} question={q} answer={a} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-20 lg:py-28 px-6 overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2 opacity-30" />
          <div className="max-w-[600px] mx-auto relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-normal leading-[1.1] tracking-[-0.015em] mb-5 text-balance" style={{ fontFamily: SERIF }}>
              {t.finalCta.title}
            </h2>
            <p className="text-text-secondary mb-7 text-lg leading-relaxed max-w-[560px] mx-auto">{t.finalCta.body}</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button type="button" onClick={checkout} disabled={checkoutLoading}
                className="px-8 py-3.5 rounded-md text-[15px] font-semibold bg-gold-bright text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03] disabled:opacity-50">
                {checkoutLoading ? "Đang chuyển..." : t.finalCta.primaryCta}
              </button>
              <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-md text-[15px] font-semibold border border-border text-text-primary no-underline transition-all duration-200 hover:border-gold/30 hover:text-gold">
                {t.finalCta.secondaryCta}<ArrowUpRight size={17} className="ml-1.5" />
              </a>
            </div>
            <p className="mt-8 text-[11px] text-text-muted max-w-[440px] mx-auto leading-relaxed">{t.finalCta.guarantee}</p>
          </div>
        </section>
      </main>

      {/* Footer — đồng bộ với landing */}
      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <BrandLink logoSize={32} wordmarkClassName="text-lg" />
              <p className="text-sm text-text-muted leading-relaxed max-w-[240px] mt-4">{t.footer.tagline}</p>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">{t.footer.product}</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.goldmaster}</Link>
                <Link href="/#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.scalp}</Link>
                <Link href="/tigold" className="text-sm font-medium hover:opacity-80 transition-colors no-underline" style={{ color: "#00c98d" }}>{t.footer.tigold}</Link>
                <Link href="/tools/calculator" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.tools}</Link>
                <Link href="/track-record" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.trackRecord}</Link>
                <Link href="/compare" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.compare}</Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">{t.footer.company}</div>
              <div className="flex flex-col gap-2.5">
                <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.telegram}</a>
                <Link href="/pricing" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.nav.pricing}</Link>
                <Link href="/login" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.login}</Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">{t.footer.legal}</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/privacy" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.privacy}</Link>
                <Link href="/terms" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.terms}</Link>
                <Link href="/disclaimer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.disclaimer}</Link>
              </div>
            </div>
          </div>
          <div className="pt-7 border-t border-border">
            <p className="text-[11px] text-text-muted">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PricingCard                                                                */
/* -------------------------------------------------------------------------- */
function PricingCard({ name, tagline, features, price, perMo, off, periodLabel, perMonthLabel, cta, popular = false, popularLabel, loading = false, onCta }: {
  name: string; tagline: string; features: string[];
  price: number; perMo?: number; off?: number;
  periodLabel?: string; perMonthLabel: string;
  cta: string; popular?: boolean; popularLabel: string;
  loading?: boolean; onCta: () => void;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <div ref={ref} className={cn("relative rounded-xl border p-6 sm:p-7 flex flex-col transition-all duration-500",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      popular ? "" : "border-border bg-card")}
      style={popular ? { borderColor: "rgba(212,168,67,0.4)", background: "linear-gradient(168deg, rgba(212,168,67,0.08), var(--bg-card) 60%)" } : undefined}>
      {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gold-bright text-[#060609] text-[11px] font-semibold rounded-full">{popularLabel}</span>}
      <h3 className={cn("text-lg font-semibold", popular ? "text-gold-bright" : "text-text-primary")}>{name}</h3>
      <p className="text-[12px] text-text-muted mt-1 mb-4">{tagline}</p>
      <div className="mb-1 flex items-baseline gap-1.5">
        <span className={cn("font-mono text-4xl font-bold", popular ? "text-gold-bright" : "text-text-primary")}>${price}</span>
        {periodLabel && <span className="text-text-muted text-sm">/ {periodLabel}</span>}
      </div>
      <p className="text-[11px] text-text-muted mb-5 h-4">
        {perMo && off ? `≈ $${perMo}${perMonthLabel} · −${off}%` : " "}
      </p>
      <ul className="space-y-2.5 mb-7 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary">
            <Check size={14} className={cn("shrink-0 mt-0.5", popular ? "text-gold-bright" : "text-green")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onCta} disabled={loading}
        className={cn("w-full py-3 rounded-md text-sm font-semibold cursor-pointer transition-transform disabled:opacity-50",
          popular ? "bg-gold-bright text-[#060609] hover:scale-[1.02] border-none" : "border border-border text-gold hover:bg-gold/5")}>
        {loading ? "Đang chuyển..." : cta}
      </button>
    </div>
  );
}
