"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { InstallAppButton } from "@/components/shared/install-app-button";
import { SocialLinks } from "@/components/shared/social-links";
import { NavBar } from "@/components/shared/nav-bar";
import { MainNavActions } from "@/components/shared/site-nav";
import { mainNavLinks } from "@/components/shared/nav-links";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { useLocale } from "@/hooks/use-locale";
import { LANDING_COPY } from "@/lib/landing-copy";
import {
  PRICING_FREE_COPY,
  RENEW_ADMIN_URL,
  SUPPORT_TELEGRAM_URL,
} from "@/lib/pricing-free-copy";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */
const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";

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
  const f = PRICING_FREE_COPY[locale];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" />
        <div className="h1" /><div className="h2" />
      </div>

      {/* Nav — đồng bộ với landing */}
      <NavBar
        navClassName={cn("transition-all duration-500", scrolled ? "bg-deep/85 backdrop-blur-xl border-b border-border" : "bg-transparent")}
        containerClassName="max-w-[1180px] mx-auto px-6"
        links={mainNavLinks(locale, "/pricing")}
        actions={<MainNavActions locale={locale} />}
      />

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative pt-32 pb-12 lg:pb-16 px-6 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[900px] h-[700px] -top-80 -right-40" />
          <GlowOrb className="w-[500px] h-[500px] -bottom-20 -left-20" />
          <div className="max-w-[860px] mx-auto relative z-10 text-center">
            <SectionTag>{f.eyebrow}</SectionTag>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-[-0.015em] mb-5 text-balance" style={{ fontFamily: SERIF }}>
              {f.title}
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-[620px] mx-auto">{f.intro}</p>
          </div>
        </section>

        {/* Free offer card + steps */}
        <section className="relative pb-20 lg:pb-28 px-6">
          <GlowOrb className="w-[600px] h-[600px] top-10 left-1/2 -translate-x-1/2 opacity-40" />
          <div className="max-w-[960px] mx-auto relative z-10 grid lg:grid-cols-2 gap-6 items-stretch">
            {/* The single free offer */}
            <div className="relative rounded-xl border p-7 flex flex-col"
              style={{ borderColor: "rgba(212,168,67,0.4)", background: "linear-gradient(168deg, rgba(212,168,67,0.08), var(--bg-card) 60%)" }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gold-bright text-[#060609] text-[11px] font-semibold rounded-full">{f.trialBadge}</span>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {f.eas.map((ea) => (
                  <span key={ea} className="text-[11px] font-semibold px-2 py-1 rounded-md border border-gold/25 text-gold" style={{ background: "rgba(212,168,67,0.06)" }}>{ea}</span>
                ))}
              </div>
              <div className="mb-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold text-gold-bright">$0</span>
                <span className="text-text-muted text-sm">· {f.priceWord}</span>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {f.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-[13px] text-text-secondary">
                    <Check size={14} className="shrink-0 mt-0.5 text-gold-bright" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup?redirect=/dashboard" className="w-full py-3 rounded-md text-sm font-semibold text-center bg-gold-bright text-[#060609] no-underline transition-transform hover:scale-[1.02]">
                {f.primaryCta}
              </Link>
              <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                className="mt-2.5 w-full py-2.5 rounded-md text-sm font-semibold text-center border border-border text-text-primary no-underline transition-colors hover:border-gold/30 hover:text-gold inline-flex items-center justify-center gap-1.5">
                {f.telegramCta}<ArrowUpRight size={15} />
              </a>
            </div>

            {/* How it works — 3 steps */}
            <div className="rounded-xl border border-border bg-card p-7 flex flex-col">
              <h2 className="text-lg font-semibold text-text-primary mb-5">{f.stepsTitle}</h2>
              <ol className="space-y-4 flex-1">
                {f.steps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="shrink-0 grid place-items-center w-7 h-7 rounded-full bg-gold/10 border border-gold/25 text-gold text-sm font-bold">{i + 1}</span>
                    <span className="text-sm text-text-secondary leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-[12px] text-text-muted leading-relaxed mb-2.5">{f.renewNote}</p>
                <a href={RENEW_ADMIN_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gold hover:text-gold-bright transition-colors font-medium text-sm no-underline">
                  {f.renewCta}<ArrowUpRight size={15} />
                </a>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-center text-text-muted mt-8 max-w-[560px] mx-auto leading-relaxed">{f.disclaimer}</p>
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
              <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
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
              <Link href="/signup?redirect=/dashboard"
                className="px-8 py-3.5 rounded-md text-[15px] font-semibold bg-gold-bright text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]">
                {f.primaryCta}
              </Link>
              <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
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
              <div className="mt-4 flex flex-nowrap items-center gap-3">
                <InstallAppButton locale={locale} compact />
                <SocialLinks />
              </div>
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
                <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">{t.footer.telegram}</a>
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
