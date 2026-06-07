"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ChartPreview } from "@/components/dashboard/chart-preview";
import { DashboardMockup } from "@/components/dashboard/dashboard-mockup";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { SiteFooter } from "@/components/shared/site-footer";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

const features = [
  {
    icon: "◆",
    title: "Niche Indicators",
    description:
      "Gold-specific context across SGE premiums, COT positioning, COMEX inventory, ETF flows, real yields, and cross-asset correlation.",
    size: "tall" as const,
  },
  {
    icon: "◇",
    title: "Focused XAUUSD Dashboard",
    description:
      "One dark interface for the asset you trade every day, without switching between generic charting tools and scattered data pages.",
    size: "wide" as const,
  },
  {
    icon: "▣",
    title: "Smart Alerts",
    description:
      "Set multi-condition alerts around indicator shifts, price levels, and macro pressure. Know when gold is approaching your zones without staring at charts all day.",
    size: "normal" as const,
  },
  {
    icon: "▥",
    title: "Live Gold Data",
    description:
      "XAUUSD price, volume, and market depth flow into one dashboard. No more jumping between TradingView, news sites, and spreadsheets.",
    size: "normal" as const,
  },
  {
    icon: "⬡",
    title: "Trader-Safe Copy",
    description:
      "Dralvo summarizes context. It does not place trades, promise returns, or provide financial advice.",
    size: "normal" as const,
  },
  {
    icon: "◈",
    title: "Free During Beta",
    description:
      "Every early user gets full Pro access at no cost while we refine the dashboard. You help shape the product before anyone else.",
    size: "wide" as const,
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    label: "Available now",
    highlighted: false,
    features: [
      "Full XAUUSD dashboard with live price",
      "3 gold-specific signals: SGE premium spread, COT net positioning, COMEX inventory trend",
      "1 custom alert — set your own price and indicator conditions",
      "Dark-mode interface, no ads, no clutter",
      "Early access to beta updates and new features",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    label: "Coming Q3 2026",
    highlighted: true,
    features: [
      "All 6 gold indicators: SGE premiums, COT positioning, COMEX inventory, ETF flows, real yields, cross-asset correlation",
      "Real-time data pipeline — no delays, no stale numbers",
      "5 saved alerts with custom price and indicator conditions",
      "CSV export for your own backtesting and analysis",
      "Priority access to new indicators before Free tier",
      "Everything in Free, unlocked and live",
    ],
  },
  {
    name: "Premium",
    price: "Custom",
    period: "",
    label: "On roadmap",
    highlighted: false,
    features: [
      "AI Gold Health Score — a single composite rating from all 6 indicators",
      "API access for integrating Dralvo data into your own tools",
      "Custom dashboard layout — arrange indicators your way",
      "Advanced alert chains with AND/OR logic across indicators",
      "Priority support and feature requests",
      "Everything in Pro, plus power-user controls",
    ],
  },
];

/* ─── Scroll-reveal hook ─── */
function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion
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
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

const faqItems = [
  {
    question: "What is Dralvo?",
    answer:
      "Dralvo is a focused XAUUSD analysis dashboard that turns scattered gold data into one decision surface. It tracks six gold-specific indicators — SGE premiums, COT positioning, COMEX inventory, ETF flows, real yields, and cross-asset correlation — so you can see the full picture before every trade. Dralvo does not execute trades, provide financial advice, or promise returns.",
  },
  {
    question: "Is Dralvo free?",
    answer:
      "Yes — during the private beta, every early user gets full Pro access at no cost. When the full pipeline goes live (Q3 2026), the Free tier will keep the core dashboard with 3 indicators and 1 custom alert. The Pro tier ($19/month) unlocks all 6 indicators, real-time data, 5 alerts, and CSV export. No credit card required to join the beta.",
  },
  {
    question: "Does Dralvo give trading signals or tell me when to buy?",
    answer:
      "No. Dralvo summarizes context — it surfaces indicator shifts, price levels, and macro pressure so you can make your own decisions. It does not place trades, issue buy/sell signals, or provide financial advice. You remain fully responsible for your trading decisions and risk management.",
  },
  {
    question: "What indicators does Dralvo track?",
    answer:
      "Six gold-specific indicators: SGE premium spread (physical demand in Shanghai), COT Swap Dealer net positioning (smart money flow), COMEX registered inventory (deliverable supply), gold ETF flows (institutional sentiment), TIPS real yields (opportunity cost of holding gold), and gold-BTC correlation (cross-asset pressure). Each one answers a specific question about what is driving gold right now.",
  },
  {
    question: "How is Dralvo different from TradingView?",
    answer:
      "TradingView is a general-purpose charting platform for every asset class. Dralvo is purpose-built for one asset: XAUUSD. Instead of generic indicators applied to gold, Dralvo tracks gold-native signals that general platforms do not surface — like SGE premiums, COMEX vault inventory, and COT dealer positioning. No switching between charts, news sites, and spreadsheets.",
  },
  {
    question: "When does Dralvo launch?",
    answer:
      "The private beta is forming now — early users get full Pro access while we refine the dashboard. The Pro tier with real-time data, all 6 indicators, and CSV export is targeted for Q3 2026. Premium (AI Gold Health Score, API access, custom layouts) is on the roadmap with no fixed date yet.",
  },
  {
    question: "Can I export data for my own analysis?",
    answer:
      "CSV export is a Pro-tier feature coming in Q3 2026. You will be able to download indicator snapshots and price data for backtesting, spreadsheet analysis, or feeding into your own tools. During the beta, all Pro features — including CSV export once available — are free for early users.",
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-deep text-text-primary overflow-x-hidden">
      {/* Gold vein decorative lines — fixed background */}
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
            : "bg-transparent"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-text-secondary hover:text-gold transition-colors no-underline tracking-[0.02em]"
              >
                {item.label}
              </a>
            ))}
            <ThemeToggle />
            <button
              type="button"
              onClick={scrollToWaitlist}
              className="px-5 py-2 bg-gold text-deep rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-bright transition-colors"
            >
              Get Early Access
            </button>
          </div>

          {/* Mobile hamburger — refined spring-like transition */}
          <button
            type="button"
            className="md:hidden flex flex-col gap-1.5 p-2 group"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span
              className={cn(
                "block w-5 h-px bg-text-primary transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                mobileOpen && "rotate-45 translate-y-[5px]"
              )}
            />
            <span
              className={cn(
                "block w-5 h-px bg-text-primary transition-all duration-200",
                mobileOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
              )}
            />
            <span
              className={cn(
                "block w-5 h-px bg-text-primary transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                mobileOpen && "-rotate-45 -translate-y-[5px]"
              )}
            />
          </button>
        </div>

        <div className={cn("md:hidden overflow-hidden transition-all duration-300", mobileOpen ? "max-h-96" : "max-h-0")}>
          <div className="px-6 py-4 bg-surface border-t border-border flex flex-col gap-3">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-text-secondary hover:text-gold transition-colors no-underline py-1"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="py-1">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                scrollToWaitlist();
              }}
              className="mt-2 px-5 py-2.5 bg-gold text-deep rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-bright transition-colors"
            >
              Get Early Access
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* ═══════════════════════════════════════════
            HERO — 4 elements only: eyebrow + headline + subtext + CTAs
            ═══════════════════════════════════════════ */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[800px] h-[800px] -top-40 -right-40" />
          <GlowOrb className="w-[600px] h-[600px] -bottom-20 -left-20" />

          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] gap-12 items-center max-lg:grid-cols-1">
              <div>
                {/* Eyebrow — only one on the entire page */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-border-gold rounded-full text-[11px] tracking-[0.15em] uppercase text-gold mb-8 bg-gold/5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-shimmer" />
                  Private beta forming
                </div>

                {/* Headline — capped at 2 lines on desktop */}
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-[-0.02em] text-text-primary mb-6 max-w-[680px]">
                  Drill into gold before the crowd sees the seam.
                </h1>

                <p className="text-lg text-text-secondary leading-relaxed max-w-[560px] mb-10">
                  Dralvo is a focused XAUUSD analysis that turns scattered gold
                  data into a precise dashboard for traders. No generic market clutter,
                  no trade calls, just gold-specific context.
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={scrollToWaitlist}
                    className="px-8 py-3.5 bg-gold text-deep rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-bright transition-all duration-300 hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)]"
                  >
                    Get Early Access
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-8 py-3.5 border border-border-gold text-gold rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold/10 transition-all duration-300 no-underline"
                  >
                    View Demo
                  </Link>
                </div>
              </div>

              <ChartPreview />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES — Bento grid layout (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="features" className="py-24 border-t border-border relative">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                Everything you need to trade XAUUSD better
              </h2>
              <p className="text-text-secondary max-w-[560px] mx-auto">
                Six gold-specific signals. One focused dashboard. Zero distractions
                from assets you don&apos;t trade.
              </p>
            </div>

            {/* Bento grid: tall + wide + normal tiles */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 auto-rows-[minmax(180px,auto)]">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} delay={index * 80} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DOCS — Centered cards (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="docs" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[1100px] mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                Built for gold traders, not generalists
              </h2>
              <p className="text-text-secondary max-w-[560px] mx-auto">
                Every feature in Dralvo is designed around one asset and one goal:
                giving XAUUSD traders a clearer view before every decision.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
              <DocCard title="What We Track" href="/docs/PROJECT_PLAN.md" copy="Six gold-specific indicators: SGE premiums, COT, COMEX inventory, ETF flows, real yields, and cross-asset correlation." />
              <DocCard title="How It Works" href="/docs/ARCHITECTURE.md" copy="Data flows from source to dashboard in three steps: ingest, normalize, surface. No trade calls, just context." />
              <DocCard title="Dashboard Preview" href="/dashboard" copy="See the live dashboard with real XAUUSD price, indicator cards, and the same interface beta users will use." />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DASHBOARD PREVIEW — Full mockup
            ═══════════════════════════════════════════ */}
        <section id="dashboard-preview" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[1100px] mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                One dashboard. Six signals. Zero noise.
              </h2>
              <p className="text-text-secondary max-w-[620px] mx-auto">
                Every indicator on this screen is purpose-built for XAUUSD. No generic market data,
                no cluttered charts — just the context gold traders need before every decision.
              </p>
            </div>
            <DashboardMockup />
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — Split-screen layout (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="how-it-works" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[400px] h-[400px] -top-20 -left-20" />
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[1fr_1fr] gap-16 items-center max-lg:grid-cols-1 max-lg:gap-12">
              {/* Left: headline + description */}
              <div>
                <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                  From scattered gold data to one decision surface
                </h2>
                <p className="text-text-secondary leading-relaxed max-w-[480px]">
                  Dralvo does not trade for users. It organizes context so users can
                  make their own decisions with a clearer view.
                </p>
              </div>

              {/* Right: vertical step cards */}
              <div className="flex flex-col gap-8">
                <StepCard step={1} title="Ingest" description="Collect XAUUSD price and six gold-specific indicators from trusted sources, updated at the cadence that matters for your trading session." />
                <StepCard step={2} title="Normalize" description="Clean and structure the data so every number on your dashboard is consistent, comparable, and ready to act on." />
                <StepCard step={3} title="Surface" description="Present trader-safe summaries and alert-ready conditions. No trade calls, no hype — just the context you need." />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ — Accordion (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="faq" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] -bottom-40 -right-40" />
          <div className="max-w-[760px] mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                Questions traders ask before joining
              </h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">
                Straight answers about Dralvo. No marketing fluff.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {faqItems.map((item, i) => (
                <FaqItem key={i} {...item} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            PRICING — Centered cards (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="pricing" className="py-24 border-t border-border relative">
          <GlowOrb className="w-[400px] h-[400px] top-0 right-0" />
          <div className="max-w-[1100px] mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                One free tier. One Pro tier. No surprises.
              </h2>
              <p className="text-text-secondary max-w-[620px] mx-auto">
                Free gives you the core XAUUSD dashboard with 3 indicators and 1 alert — everything
                you need to evaluate Dralvo during beta. Pro unlocks all 6 gold-specific signals,
                real-time data, 5 alerts, and CSV export when the full pipeline goes live.
                No credit card. No auto-billing. No hidden fees.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 max-w-[940px] mx-auto">
              {pricing.map((tier) => (
                <PricingCard key={tier.name} {...tier} onCta={scrollToWaitlist} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WAITLIST — With dashboard preview visual
            ═══════════════════════════════════════════ */}
        <section id="waitlist" className="py-24 border-t border-border relative overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[900px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[1fr_1fr] gap-12 items-center max-md:grid-cols-1">
              {/* Left: CTA copy + form */}
              <div>
                <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                  Ready to <span className="text-gold italic">Drill Into Gold</span>?
                </h2>
                <p className="text-text-secondary mb-8 max-w-[420px]">
                  Join the private beta. Get full Pro access at no cost while we
                  refine the dashboard with early user feedback.
                </p>
                <WaitlistForm />
              </div>

              {/* Right: mini dashboard preview */}
              <div className="max-md:hidden">
                <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red/70" />
                      <div className="w-2 h-2 rounded-full bg-gold-bright/70" />
                      <div className="w-2 h-2 rounded-full bg-green/70" />
                    </div>
                    <span className="text-[10px] text-text-muted font-mono ml-2">Dralvo · Waitlist Preview</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-text-muted">XAUUSD</span>
                      <span className="font-display text-lg text-gold">2,651.43</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-3">
                      {[
                        { label: "AI Signal", value: "BUY", cls: "text-green" },
                        { label: "RSI (14)", value: "58.3" },
                        { label: "Trend", value: "Bullish", cls: "text-green" },
                        { label: "S / R", value: "2,640 / 2,665" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-text-muted">{row.label}</span>
                          <span className={cn("font-mono text-xs font-medium", row.cls || "text-text-primary")}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green" />
                      </span>
                      <span className="text-[10px] text-green font-mono">Beta access pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ABOUT / DISCLAIMER
            ═══════════════════════════════════════════ */}
        <section id="about" className="py-16 border-t border-border">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <p className="text-sm leading-relaxed text-text-muted">
              Dralvo is for informational purposes only, not financial advice. Users
              remain responsible for their own trading decisions and risk management.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ─── Shared Components ─── */

function Stat({ value, label, large = false }: { value: string; label: string; large?: boolean }) {
  return (
    <div className={large ? "text-center group" : ""}>
      <div
        className={cn(
          "font-mono text-text-primary font-medium",
          large
            ? "text-5xl text-gold-bright tracking-[-0.02em] relative inline-block"
            : "text-sm"
        )}
      >
        {large && (
          <span className="absolute -inset-4 rounded-full bg-gold/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        )}
        <span className="relative">{value}</span>
      </div>
      <div className="text-[11px] text-text-muted mt-2 uppercase tracking-[0.12em]">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative bg-surface border border-border rounded-xl p-8 transition-all duration-700 overflow-hidden",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Card-accent: left gold border on hover */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-gold/0 group-hover:bg-gold/60 transition-all duration-500" />
      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-xl mb-5 group-hover:bg-gold/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-display text-xl text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  const { ref, visible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-5 group transition-all duration-700",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
      )}
    >
      <div className="shrink-0 w-12 h-12 rounded-xl bg-gold/10 border border-border-gold flex items-center justify-center font-mono text-gold text-lg font-semibold group-hover:bg-gold/15 transition-colors">
        {step}
      </div>
      <div>
        <h4 className="font-display text-lg text-text-primary mb-2">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

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

  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border rounded-xl overflow-hidden transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        open && "border-border-gold"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
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
              : "group-hover:border-border-gold group-hover:bg-gold/5"
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
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  label,
  highlighted,
  features,
  onCta,
}: {
  name: string;
  price: string;
  period: string;
  label: string;
  highlighted: boolean;
  features: string[];
  onCta: () => void;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-surface border rounded-2xl p-8 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        highlighted
          ? "border-gold/40 bg-gradient-to-b from-gold/5 to-surface shadow-[0_0_60px_rgba(212,168,67,0.06)]"
          : "border-border hover:border-border-gold"
      )}
    >
      {highlighted && (
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      )}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-card border border-border text-gold text-[11px] font-semibold rounded-full tracking-[0.05em]">
        {label}
      </div>
      <h3 className="font-display text-xl text-text-primary mb-2">{name}</h3>
      <div className="mb-6">
        <span className="font-mono text-4xl font-semibold text-text-primary">{price}</span>
        <span className="text-text-muted text-sm ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
            <span className="text-gold mt-0.5 shrink-0">▸</span>
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-semibold tracking-[0.03em] transition-all duration-300",
          highlighted
            ? "bg-gold text-deep hover:bg-gold-bright hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)]"
            : "border border-border-gold text-gold hover:bg-gold/10"
        )}
      >
        Join Waitlist
      </button>
    </div>
  );
}

function DocCard({ title, copy, href }: { title: string; copy: string; href: string }) {
  const { ref: divRef, visible: divVisible } = useScrollReveal<HTMLDivElement>(0.1);
  const { ref: linkRef, visible: linkVisible } = useScrollReveal<HTMLAnchorElement>(0.1);
  const internalDoc = href.endsWith(".md");

  const content = (
    <>
      <h3 className="font-display text-xl text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{copy}</p>
    </>
  );

  if (internalDoc) {
    return (
      <div
        ref={divRef}
        className={cn(
          "bg-surface border border-border rounded-xl p-6 transition-all duration-700",
          divVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        {content}
        <p className="text-[11px] text-gold mt-5">Read more →</p>
      </div>
    );
  }

  return (
    <Link
      ref={linkRef}
      href={href}
      className={cn(
        "bg-surface border border-border rounded-xl p-6 no-underline transition-all duration-700 hover:border-border-gold",
        linkVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {content}
      <p className="text-[11px] text-gold mt-5">Open preview →</p>
    </Link>
  );
}
