"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck, Activity, Layers, ScanLine } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { LANDING_COPY } from "@/lib/landing-copy";
import { EA_PRODUCTS, GOLDMASTER, GOLD_SCALP, TIGOLD, type EaProduct } from "@/lib/backtest-stats";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Accent system — gold = patient swing, steel = fast scalp                   */
/* -------------------------------------------------------------------------- */
const STEEL = "90,169,230";
const GOLD = "212,168,67";
const EMERALD = "0,201,141";
const rgb = (a: EaProduct["accent"]) => (a === "steel" ? STEEL : a === "emerald" ? EMERALD : GOLD);
const accent = (a: EaProduct["accent"], al: number) => `rgba(${rgb(a)},${al})`;
const accentText = (a: EaProduct["accent"]) => (a === "steel" ? "#7dc0f0" : a === "emerald" ? "#00c98d" : "var(--gold-bright)");

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";

const PERIODS = [
  { id: "monthly", months: 1 },
  { id: "sixmo", months: 6 },
  { id: "yearly", months: 12 },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

/* Dralvo Unlimited price by billing period (the Free tier is always $0).
 * total = charged now for the period · perMo = per-month equivalent · off = % saved. */
const UNLIMITED_PRICING: Record<PeriodId, { total: number; perMo: number; off: number }> = {
  monthly: { total: 59, perMo: 59, off: 0 },
  sixmo: { total: 319, perMo: 53, off: 10 },
  yearly: { total: 599, perMo: 50, off: 15 },
};

/* Deterministic equity-curve shape (normalised) — compounding with pullbacks. */
const EQUITY = [
  0.02, 0.04, 0.03, 0.06, 0.09, 0.07, 0.12, 0.16, 0.13, 0.2, 0.26, 0.22, 0.3,
  0.38, 0.33, 0.45, 0.55, 0.49, 0.62, 0.72, 0.65, 0.81, 0.93, 0.86, 1,
];

/* -------------------------------------------------------------------------- */
/*  Small parts                                                                */
/* -------------------------------------------------------------------------- */
function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium border border-border text-text-muted" style={{ background: "rgba(26,26,42,0.4)" }}>{children}</div>
  );
}

/** Scroll-reveal wrapper: fades + rises into view once. Honors reduced motion. */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal(0.14);
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out will-change-transform", className)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(22px)", transitionDelay: `${visible ? delay : 0}ms` }}>
      {children}
    </div>
  );
}

function EquityCurve() {
  const W = 460, H = 200, P = 8;
  const max = EQUITY.length - 1;
  const pts = EQUITY.map((y, i) => [P + (i / max) * (W - 2 * P), H - P - y * (H - 2 * P)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W - P} ${H - P} L${P} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(240,200,90,0.35)" />
          <stop offset="100%" stopColor="rgba(240,200,90,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#eq)" />
      <path className="eq-line" d={line} fill="none" stroke="var(--gold-bright)" strokeWidth={2} strokeLinejoin="round" />
      {pts.slice(-1).map(([x, y], i) => (<circle key={i} cx={x} cy={y} r={3.5} fill="var(--gold-bright)" />))}
    </svg>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-lg overflow-hidden transition-colors duration-300", open ? "border-gold/25" : "border-border")} style={{ background: open ? "rgba(212,168,67,0.05)" : "transparent" }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group">
        <span className={cn("text-sm font-medium text-left", open ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary")}>{q}</span>
        <span className="shrink-0 text-base font-light text-gold transition-transform duration-300" style={{ transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">{open && <p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">{a}</p>}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EA assay plate                                                            */
/* -------------------------------------------------------------------------- */
function EaPlate({ ea, copy, onGet, badge }: { ea: EaProduct; copy: (typeof LANDING_COPY)["en"]["products"]; onGet: () => void; badge?: string }) {
  const a = ea.accent;
  const styleKey = ea.id === "goldmaster" ? "swing" : ea.id === "scalp" ? "scalp" : "free";
  return (
    <div className="lift group relative rounded-2xl border bg-card p-7 flex flex-col"
      style={{ borderColor: accent(a, 0.28), background: `linear-gradient(168deg, ${accent(a, 0.06)}, var(--bg-card) 55%)`, boxShadow: `0 1px 0 ${accent(a, 0.15)} inset, 0 24px 60px -40px ${accent(a, 0.5)}`, ["--lift" as string]: accent(a, 0.45), ["--lift-bd" as string]: accent(a, 0.5) } as React.CSSProperties}>
      <div className="absolute top-0 left-7 right-7 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent(a, 0.6)}, transparent)` }} />
      {badge && <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-semibold border" style={{ background: accentText(a), color: "#060609", borderColor: accentText(a) }}>{badge}</span>}
      <div className="absolute top-4 right-4 flex items-center gap-2 select-none">
        <span className="text-[9px] font-mono tracking-[0.12em] uppercase" style={{ color: accentText(a) }}>{ea.version}</span>
        <span className="w-7 h-7 rotate-45 rounded-[3px] border flex items-center justify-center" style={{ borderColor: accent(a, 0.4) }}>
          <span className="-rotate-45 text-[7px] font-mono" style={{ color: accentText(a) }}>999.9</span>
        </span>
      </div>

      <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: accentText(a) }}>{copy.styleTag[styleKey]}</span>
      <h3 className="text-3xl mt-2" style={{ fontFamily: SERIF }}>{ea.name}</h3>
      <p className="text-[13px] text-text-muted mt-1">{copy.styleName[styleKey]}</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 font-mono text-[10.5px] text-text-muted">
        <span>{ea.symbol}</span><span style={{ color: accentText(a) }}>·</span>
        <span>{ea.timeframe}</span><span style={{ color: accentText(a) }}>·</span>
        <span>{copy.directionLabels[ea.direction]}</span>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 self-start text-[11px]" style={{ color: accentText(a) }}>
        <ShieldCheck size={13} />{copy.verified[ea.id]}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-6">
        {ea.headline.map((kpi, i) => (
          <div key={i} className="rounded-lg border border-border bg-deep/40 p-3">
            <div className={cn("font-mono text-xl font-bold tracking-tight", kpi.tone === "good" ? "text-green" : kpi.tone === "bad" ? "text-red" : "")} style={kpi.tone ? undefined : { color: accentText(a) }}>{kpi.value}</div>
            <div className="text-[9.5px] leading-tight uppercase tracking-[0.04em] text-text-muted mt-1">{copy.headlineLabels[i]}</div>
          </div>
        ))}
      </div>
      <div className="font-mono text-xs text-text-secondary mt-3">{ea.finalBalance}</div>

      <p className="text-[13.5px] leading-relaxed text-text-secondary mt-5">{copy.pitch[ea.id]}</p>
      <ul className="space-y-2 mt-5 flex-1">
        {copy.bullets[ea.id].map((b) => (<li key={b} className="flex items-start gap-2 text-[13px] text-text-secondary"><Check size={15} className="shrink-0 mt-0.5" style={{ color: accentText(a) }} /><span>{b}</span></li>))}
      </ul>

      <button onClick={onGet} className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-md text-sm font-semibold text-[#060609] transition-transform duration-200 hover:scale-[1.02] border-none cursor-pointer" style={{ background: accentText(a) }}>
        {copy.cta} {ea.name.replace("Dralvo ", "")} <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const { locale } = useLocale();
  const t = LANDING_COPY[locale];
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<EaProduct["id"]>("goldmaster");
  const [period, setPeriod] = useState<PeriodId>("monthly");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const checkout = useCallback(
    async (plan: "unlimited") => {
      setLoading(true);
      setCheckoutError(null);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, period }),
        });
        if (res.status === 401) { window.location.href = "/signup?redirect=pricing"; return; }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) { window.location.href = data.url; return; }
        setCheckoutError(data.error || "Không thể tạo phiên thanh toán. Vui lòng thử lại.");
        setLoading(false);
      } catch {
        setCheckoutError("Lỗi kết nối. Vui lòng thử lại.");
        setLoading(false);
      }
    },
    [period],
  );

  const activeEa = tab === "goldmaster" ? GOLDMASTER : tab === "scalp" ? GOLD_SCALP : TIGOLD;
  const p = t.products;
  const unlimitedPrice = UNLIMITED_PRICING[period];

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      {/* JSON-LD rendered into the initial server HTML (not a client Script) so
          non-JS crawlers and LLM agents can read the structured data. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://www.dralvo.com/#org",
                name: "Dralvo Capital",
                url: "https://www.dralvo.com",
                logo: "https://www.dralvo.com/brand/dralvo-icon-180.png",
                description:
                  "Dralvo Capital builds verified automated XAUUSD (gold) trading robots for MetaTrader 5: GoldMaster (D1 swing), GoldScalp (M5 momentum) and the free TiGold engine. No martingale, no grid.",
                sameAs: ["https://t.me/dralvoea"],
              },
              {
                "@type": "WebSite",
                "@id": "https://www.dralvo.com/#website",
                url: "https://www.dralvo.com",
                name: "Dralvo",
                publisher: { "@id": "https://www.dralvo.com/#org" },
                inLanguage: ["en", "vi", "pt-BR", "zh", "es", "hi", "id", "ru"],
              },
              {
                "@type": "Product",
                name: "Dralvo Unlimited",
                brand: { "@id": "https://www.dralvo.com/#org" },
                category: "Automated trading software (MetaTrader 5 Expert Advisor)",
                operatingSystem: "Windows (MetaTrader 5)",
                description:
                  "The full Dralvo ecosystem — GoldMaster (D1 swing), GoldScalp (M5 momentum) and TiGold robots for XAUUSD — with unlimited MT5 accounts. No martingale, no grid.",
                offers: {
                  "@type": "Offer",
                  priceCurrency: "USD",
                  price: "59",
                  availability: "https://schema.org/InStock",
                  priceSpecification: [
                    { "@type": "UnitPriceSpecification", price: "59", priceCurrency: "USD", referenceQuantity: { "@type": "QuantitativeValue", value: "1", unitCode: "MON" }, name: "Monthly" },
                    { "@type": "UnitPriceSpecification", price: "599", priceCurrency: "USD", referenceQuantity: { "@type": "QuantitativeValue", value: "12", unitCode: "MON" }, name: "Yearly" },
                  ],
                },
              },
              {
                "@type": "Product",
                name: "Dralvo TiGold",
                brand: { "@id": "https://www.dralvo.com/#org" },
                category: "Automated trading software (MetaTrader 5 Expert Advisor)",
                operatingSystem: "Windows (MetaTrader 5)",
                description:
                  "A free adaptive XAUUSD trading robot for MetaTrader 5, available at no cost through the Dralvo IB partnership.",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
              },
              {
                "@type": "FAQPage",
                mainEntity: t.faq.items.map(([q, an]) => ({
                  "@type": "Question",
                  name: q,
                  acceptedAnswer: { "@type": "Answer", text: an },
                })),
              },
            ],
          }),
        }}
      />
      <div className="gold-veins" aria-hidden="true"><div className="v1" /><div className="v2" /><div className="v3" /><div className="h1" /><div className="h2" /></div>

      {/* Nav */}
      <nav className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-500", scrolled ? "bg-deep/85 backdrop-blur-xl border-b border-border" : "bg-transparent")}>
        <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="#products" className="hidden sm:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.products}</Link>
            <Link href="#evidence" className="hidden sm:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.evidence}</Link>
            <Link href="#fx-tool" className="hidden md:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.tools}</Link>
            <Link href="/tigold" className="hidden md:inline text-[13px] font-semibold hover:opacity-80 transition-colors no-underline px-2" style={{ color: "#00c98d" }}>{t.nav.tigold}</Link>
            <Link href="#pricing" className="hidden sm:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.pricing}</Link>
            <Link href="/login" className="hidden md:inline text-[13px] text-text-muted hover:text-gold transition-colors no-underline px-2">{t.nav.login}</Link>
            <Link href="#pricing" className="ml-1 rounded-md bg-gold-action px-4 py-2 text-[13px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:bg-gold-actionHover hover:scale-[1.03]">{t.nav.cta}</Link>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[900px] h-[700px] -top-80 -right-40" />
          <GlowOrb className="w-[500px] h-[500px] bottom-0 -left-32" />
          <div className="max-w-[1180px] mx-auto relative z-10 grid lg:grid-cols-[1fr_1fr] gap-14 items-center">
            <div>
              <div className="hero-rise"><Eyebrow>{t.hero.eyebrow}</Eyebrow></div>
              <h1 className="hero-rise text-[2.6rem] sm:text-6xl font-normal leading-[1.04] tracking-[-0.02em] mt-6 mb-5 text-balance" style={{ fontFamily: SERIF, animationDelay: "80ms" }}>
                {t.hero.titleA}<span className="text-gold-bright">{t.hero.titleEm}</span>
              </h1>
              <p className="hero-rise text-base sm:text-lg leading-relaxed max-w-[540px] mb-7 text-text-secondary" style={{ animationDelay: "160ms" }}>{t.hero.subtitle}</p>
              <div className="hero-rise flex flex-col sm:flex-row gap-3" style={{ animationDelay: "240ms" }}>
                <Link href="#products" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-[15px] font-semibold bg-gold-bright text-[#060609] no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]">{t.hero.ctaPrimary}<ArrowRight size={17} /></Link>
                <Link href="#evidence" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-[15px] font-semibold border border-border text-text-primary no-underline transition-colors duration-200 hover:border-gold/30 hover:text-gold">{t.hero.ctaSecondary}</Link>
              </div>
              <p className="hero-rise mt-6 font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-muted" style={{ animationDelay: "320ms" }}>{t.hero.metalNote}</p>
            </div>

            {/* Equity curve + dual readout */}
            <div className="hero-rise rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "0 30px 70px -50px rgba(240,200,90,0.6)", animationDelay: "220ms" }}>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="font-mono text-[11px]" style={{ color: "var(--gold-bright)" }}>{t.hero.equityLabel}</span>
                <span className="font-mono text-[10px] text-text-muted">{t.hero.equityRisk}</span>
              </div>
              <div className="px-3"><EquityCurve /></div>
              <div className="flex items-center justify-between px-5 pb-3 font-mono text-[11px] text-text-muted">
                <span>$100K</span><span className="text-green">→ $1.6M</span>
              </div>
              <div className="grid grid-cols-3 border-t border-border">
                {EA_PRODUCTS.map((ea, i) => (
                  <div key={ea.id} className={cn("px-5 py-3.5", i < 2 && "border-r border-border")}>
                    <div className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: accentText(ea.accent) }}>{ea.timeframe} · {ea.name.replace("Dralvo ", "")}</div>
                    <div className="font-mono text-2xl font-bold text-green mt-1">{ea.headline[0].value}</div>
                    <div className="font-mono text-[10.5px] text-text-muted mt-0.5">PF {ea.headline[1].value} · {ea.headline[2].value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[600px] h-[500px] -bottom-40 right-0 opacity-50" />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <Reveal className="text-center mb-12">
              <Eyebrow>{p.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-5xl font-normal tracking-[-0.015em] mt-5 mb-4 text-balance" style={{ fontFamily: SERIF }}>{p.title}</h2>
              <p className="text-text-secondary max-w-[600px] mx-auto">{p.intro}</p>
            </Reveal>
            <Reveal delay={80}>
              <div className="grid lg:grid-cols-3 gap-6 items-stretch">
                {EA_PRODUCTS.map((ea) => {
                  const badge = ea.id === "tigold" ? p.badgePopular : ea.id === "goldmaster" ? p.badgePro : undefined;
                  return (<EaPlate key={ea.id} ea={ea} copy={p} badge={badge} onGet={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} />);
                })}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Evidence — tabbed */}
        <section id="evidence" className="relative py-20 px-6 overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] -top-20 -left-20 opacity-40" />
          <div className="max-w-[1000px] mx-auto relative z-10">
            <div className="text-center mb-10">
              <Eyebrow>{p.evidenceEyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 text-balance" style={{ fontFamily: SERIF }}>{p.evidenceTitle}</h2>
            </div>
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
                {EA_PRODUCTS.map((ea) => {
                  const on = tab === ea.id;
                  return (<button key={ea.id} type="button" aria-pressed={on} onClick={() => setTab(ea.id)} className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none" style={on ? { background: accentText(ea.accent), color: "#060609" } : { background: "transparent", color: "var(--text-muted)" }}>{ea.name.replace("Dralvo ", "")} · {ea.timeframe}</button>);
                })}
              </div>
            </div>
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-card flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.12em] uppercase font-semibold text-text-muted">{p.matrix.title}</span>
                  <span className="font-mono text-[10px] inline-flex items-center gap-1.5" style={{ color: accentText(activeEa.accent) }}><ShieldCheck size={12} />{p.verified[activeEa.id]}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted">
                        <th className="text-left font-medium py-2.5 px-4">{p.matrix.risk}</th>
                        <th className="text-right font-medium py-2.5 px-4">{p.matrix.ret}</th>
                        <th className="text-right font-medium py-2.5 px-4">{p.matrix.dd}</th>
                        <th className="text-right font-medium py-2.5 px-4">{p.matrix.pf}</th>
                        <th className="text-right font-medium py-2.5 px-4">{activeEa.matrixExtraKey === "cagr" ? p.matrix.cagr : p.matrix.trades}</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {activeEa.riskMatrix.map((r) => (
                        <tr key={r.risk} className="border-t border-border" style={r.star ? { background: accent(activeEa.accent, 0.07) } : undefined}>
                          <td className="py-2.5 px-4 text-left">{r.risk}{r.star && <span className="ml-1" style={{ color: accentText(activeEa.accent) }}>★</span>}</td>
                          <td className="py-2.5 px-4 text-right text-green font-semibold">{r.ret}</td>
                          <td className="py-2.5 px-4 text-right text-red">{r.ddEquity}</td>
                          <td className="py-2.5 px-4 text-right text-text-secondary">{r.pf}</td>
                          <td className="py-2.5 px-4 text-right text-text-secondary">{r.extra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {activeEa.tradeStats.map((s) => (
                      <div key={s.key} className="flex flex-col">
                        <span className="font-mono text-base text-text-primary">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-[0.04em] text-text-muted">{p.statLabels[s.key as keyof typeof p.statLabels]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {activeEa.monthly &&
                  (() => {
                    const months = activeEa.monthly!;
                    const maxG = Math.max(...months.map((x) => x.gainPct));
                    return (
                      <div className="rounded-xl border border-border bg-card p-5">
                        <div className="text-[10px] uppercase tracking-[0.08em] text-text-muted mb-4">{p.monthlyTitle}</div>
                        <div className="flex items-end gap-2 h-28">
                          {months.map((m) => (
                            <div key={m.month} className="group/bar relative flex-1 h-full flex items-end">
                              <span className="absolute inset-x-0 -top-0.5 text-center font-mono text-[8.5px] text-text-secondary">+{m.gainPct}%</span>
                              <div className="w-full rounded-t transition-opacity duration-300 opacity-80 group-hover/bar:opacity-100"
                                style={{ height: `${Math.max(8, (m.gainPct / maxG) * 100)}%`, background: accentText(activeEa.accent) }} />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-1.5">
                          {months.map((m) => (<span key={m.month} className="flex-1 text-center font-mono text-[9px] text-text-muted">{m.month}</span>))}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        </section>

        {/* Trust + free FX tool (one section) */}
        <section id="tools" className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[600px] h-[400px] -bottom-24 left-1/2 -translate-x-1/2 opacity-25" />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <Reveal className="text-center mb-12">
              <Eyebrow>{t.trust.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 text-balance" style={{ fontFamily: SERIF }}>{t.trust.title}</h2>
            </Reveal>
            <Reveal delay={60}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {t.trust.items.map((item, i) => {
                  const Icon = [ShieldCheck, Activity, Layers, ScanLine][i] ?? ShieldCheck;
                  return (
                    <div key={item.title} className="lift group rounded-xl border border-border bg-card p-5">
                      <div className="icon-pop w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4"><Icon size={18} className="text-gold" /></div>
                      <h3 className="font-semibold text-text-primary text-sm mb-1.5">{item.title}</h3>
                      <p className="text-[12.5px] leading-relaxed text-text-secondary">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            {/* free FX tool — horizontal banner */}
            <Reveal delay={120} className="mt-6">
              <div id="fx-tool" className="lift group scroll-mt-24 rounded-2xl border p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5" style={{ background: "linear-gradient(110deg, rgba(90,169,230,0.09), var(--bg-card) 72%)", borderColor: "rgba(90,169,230,0.25)", ["--lift" as string]: "rgba(90,169,230,0.4)", ["--lift-bd" as string]: "rgba(90,169,230,0.45)" } as React.CSSProperties}>
                <div className="icon-pop w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(90,169,230,0.12)", border: "1px solid rgba(90,169,230,0.3)" }}>
                  <ScanLine size={22} style={{ color: "#7dc0f0" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: "#7dc0f0" }}>{t.tools.eyebrow}</span>
                    <span className="text-[10px] text-text-muted">· {t.tools.note}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-normal tracking-[-0.01em] text-balance" style={{ fontFamily: SERIF }}>{t.tools.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-text-secondary mt-1.5 max-w-[640px]">{t.tools.body}</p>
                </div>
                <Link href="/tools/calculator" className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-[#060609] no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]" style={{ background: "#7dc0f0" }}>{t.tools.cta}<ScanLine size={16} /></Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Pricing — subscription */}
        <section id="pricing" className="relative py-20 px-6 overflow-hidden">
          <GlowOrb className="w-[600px] h-[600px] top-10 left-1/2 -translate-x-1/2 opacity-40" />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="text-center mb-9">
              <Eyebrow>{t.pricing.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-5xl font-normal tracking-[-0.015em] mt-5 mb-4 text-balance" style={{ fontFamily: SERIF }}>{t.pricing.title}</h2>
              <p className="text-text-secondary max-w-[560px] mx-auto mb-7">{t.pricing.intro}</p>
              <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
                {PERIODS.map((pr) => {
                  const on = period === pr.id;
                  const off = UNLIMITED_PRICING[pr.id].off;
                  return (
                    <button key={pr.id} type="button" aria-pressed={on} onClick={() => setPeriod(pr.id)} className={cn("px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none flex items-center gap-1.5", on ? "bg-gold text-[#060609]" : "bg-transparent text-text-muted hover:text-text-primary")}>
                      {t.pricing.periods[pr.id]}{off > 0 && <span className={cn("text-[10px] font-mono", on ? "text-[#060609]/70" : "text-green")}>−{off}%</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-[820px] mx-auto">
              {t.pricing.tiers.map((tier) => {
                const isFree = tier.id === "free";
                const popular = tier.id === "unlimited";
                return (
                  <div key={tier.id} className={cn("lift rounded-xl border p-6 sm:p-7 flex flex-col relative", popular ? "" : "border-border bg-card")} style={popular ? { borderColor: "rgba(212,168,67,0.4)", background: "linear-gradient(168deg, rgba(212,168,67,0.08), var(--bg-card) 60%)" } : undefined}>
                    {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gold-bright text-[#060609] text-[11px] font-semibold rounded-full">{t.pricing.popular}</span>}
                    <h3 className={cn("text-lg font-semibold", popular ? "text-gold-bright" : "text-text-primary")}>{tier.name}</h3>
                    <p className="text-[12px] text-text-muted mt-1 mb-4">{tier.tagline}</p>
                    <div className="mb-1 flex items-baseline gap-1.5">
                      <span className={cn("font-mono text-4xl font-bold", popular ? "text-gold-bright" : "text-text-primary")}>${isFree ? 0 : unlimitedPrice.total}</span>
                      {!isFree && <span className="text-text-muted text-sm">/ {t.pricing.periods[period]}</span>}
                    </div>
                    <p className="text-[11px] text-text-muted mb-5 h-4">{!isFree && unlimitedPrice.off > 0 ? `≈ $${unlimitedPrice.perMo}${t.pricing.perMonth} · −${unlimitedPrice.off}%` : " "}</p>
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {tier.features.map((f) => (<li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary"><Check size={14} className={cn("shrink-0 mt-0.5", popular ? "text-gold-bright" : "text-green")} /><span>{f}</span></li>))}
                    </ul>
                    <button type="button" onClick={isFree ? () => { window.location.href = "/tigold"; } : () => checkout("unlimited")} disabled={loading} className={cn("w-full py-3 rounded-md text-sm font-semibold cursor-pointer transition-transform disabled:opacity-50", popular ? "bg-gold-bright text-[#060609] hover:scale-[1.02] border-none" : "border border-border text-gold hover:bg-gold/5")}>{tier.cta}</button>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] text-center text-text-muted mt-7">{t.pricing.cancelNote}</p>
            {checkoutError && <p role="alert" className="text-[12px] text-center text-red mt-2">{checkoutError}</p>}
          </div>
        </section>

        {/* FAQ — SaaS two-column */}
        <section className="relative py-20 px-6 bg-surface">
          <div className="max-w-[1000px] mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-10">
            <div className="lg:sticky lg:top-24 self-start">
              <Eyebrow>{t.faq.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-4" style={{ fontFamily: SERIF }}>{t.faq.title}</h2>
              <p className="text-text-secondary text-sm mb-4">{t.faq.notFound}</p>
              <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors font-medium text-sm no-underline">{t.faq.telegram}<ArrowUpRight size={15} /></a>
            </div>
            <div className="space-y-3">{t.faq.items.map(([q, a]) => (<FaqItem key={q} q={q} a={a} />))}</div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 px-6 overflow-hidden">
          <GlowOrb className="w-[700px] h-[600px] top-0 left-1/2 -translate-x-1/2 opacity-40" />
          <GridPattern />
          <div className="max-w-[860px] mx-auto relative z-10">
            <div className="rounded-3xl border border-gold/25 p-10 sm:p-14 text-center" style={{ background: "linear-gradient(168deg, rgba(212,168,67,0.1), var(--bg-card) 60%)", boxShadow: "0 40px 90px -60px rgba(240,200,90,0.6)" }}>
              <Eyebrow>{t.finalCta.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-5xl font-normal tracking-[-0.015em] mt-5 mb-4 text-balance" style={{ fontFamily: SERIF }}>{t.finalCta.title}</h2>
              <p className="text-text-secondary mb-7 text-lg leading-relaxed max-w-[560px] mx-auto">{t.finalCta.body}</p>
              {/* accent stat chips */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {EA_PRODUCTS.map((ea) => (
                  <span key={ea.id} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-[12px]" style={{ borderColor: accent(ea.accent, 0.3), color: accentText(ea.accent) }}>
                    {ea.name.replace("Dralvo ", "")} <span className="text-green">{ea.headline[0].value}</span>
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="#pricing" className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-md text-[16px] font-bold bg-gold-bright text-[#060609] no-underline transition-transform duration-200 hover:scale-[1.04]" style={{ boxShadow: "0 0 40px rgba(240,200,90,0.2)" }}>{t.finalCta.primaryCta}<ArrowRight size={19} /></Link>
                <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-md text-[16px] font-semibold border border-border text-text-primary no-underline transition-colors hover:border-gold/30 hover:text-gold">{t.finalCta.secondaryCta}<ArrowUpRight size={17} /></a>
              </div>
              <p className="mt-7 font-mono text-[11px] tracking-[0.04em] text-text-muted">{t.finalCta.guarantee}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
                <Link href="#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.goldmaster}</Link>
                <Link href="#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.scalp}</Link>
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
                <Link href="#pricing" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.nav.pricing}</Link>
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
