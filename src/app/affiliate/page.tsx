"use client";

import Link from "next/link";
import { BrandLink } from "@/components/shared/brand";
import { NavBar } from "@/components/shared/nav-bar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { AFFILIATE_COPY } from "@/lib/affiliate/copy";
import { AffiliateReferralTracker } from "@/components/affiliate/affiliate-referral-tracker";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`relative py-20 px-6 ${className}`}>{children}</section>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium border border-border text-text-muted bg-deep/40">
      {children}
    </div>
  );
}

export default function AffiliatePage() {
  const { locale } = useLocale();
  const t = AFFILIATE_COPY[locale];

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <AffiliateReferralTracker />

      {/* Nav */}
      <NavBar
        containerClassName="max-w-[1100px] mx-auto px-6"
        links={[
          { label: "Sản phẩm", href: "/#products" },
          { label: "Bảng giá", href: "/#pricing" },
          { label: t.navLabel, href: "/affiliate", className: "text-gold font-medium" },
        ]}
        actions={<Link href="/login" className="text-[12px] font-semibold text-text-primary hover:text-gold transition-colors no-underline">Đăng nhập</Link>}
      />

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="max-w-[1100px] mx-auto">

        {/* Hero */}
        <Section>
          <div className="text-center max-w-[720px] mx-auto">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.015em] mt-5 mb-5 text-balance" style={{ fontFamily: SERIF }}>
              {t.hero.title}
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-[560px] mx-auto">{t.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup?redirect=/dashboard/affiliate" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-[15px] font-bold bg-gold-bright text-[#060609] no-underline transition-transform duration-200 hover:scale-[1.03]">
                {t.hero.cta}
              </Link>
              <Link href="/login?redirect=/dashboard/affiliate" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-[15px] font-semibold border border-border text-text-primary hover:border-gold/40 hover:text-gold transition-all no-underline">
                {t.hero.loginCta}
              </Link>
            </div>
          </div>
        </Section>

        {/* Commission stats */}
        <Section className="bg-surface">
          <div className="text-center mb-10">
            <Eyebrow>{t.commission.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3" style={{ fontFamily: SERIF }}>{t.commission.title}</h2>
            <p className="text-text-secondary max-w-[480px] mx-auto">{t.commission.subtitle}</p>
          </div>
          <div className="grid grid-cols-1  grid-cols-2 md:grid-cols-4 gap-4 max-w-[720px] mx-auto">
            {t.commission.items.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-5 text-center">
                <div className="text-2xl font-bold text-gold-bright font-mono">{item.value}</div>
                <div className="text-[11px] text-text-muted mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section>
          <div className="text-center mb-10">
            <Eyebrow>{t.how.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5" style={{ fontFamily: SERIF }}>{t.how.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {t.how.steps.map((step, i) => (
              <div key={step.title} className="rounded-xl border border-border bg-card p-6 text-center relative">
                <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                  <span className="font-mono text-gold font-bold">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Why partner */}
        <Section className="bg-surface">
          <div className="text-center mb-10">
            <Eyebrow>{t.why.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5" style={{ fontFamily: SERIF }}>{t.why.title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-[800px] mx-auto">
            {t.why.items.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-text-primary text-sm mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* FAQ */}
        <Section>
          <div className="max-w-[720px] mx-auto">
            <div className="text-center mb-10">
              <Eyebrow>{t.faq.eyebrow}</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5" style={{ fontFamily: SERIF }}>{t.faq.title}</h2>
            </div>
            <div className="space-y-3">
              {t.faq.items.map(([q, a]) => (
                <details key={q} className="border rounded-lg border-border group">
                  <summary className="px-5 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">{q}</summary>
                  <p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        {/* CTA */}
        <Section>
          <div className="rounded-3xl border border-gold/25 p-10 sm:p-14 text-center max-w-[720px] mx-auto" style={{ background: "linear-gradient(168deg, rgba(212,168,67,0.1), var(--bg-card) 60%)" }}>
            <Eyebrow>{t.cta.eyebrow}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-4" style={{ fontFamily: SERIF }}>{t.cta.title}</h2>
            <p className="text-text-secondary mb-7 max-w-[480px] mx-auto">{t.cta.body}</p>
            <Link href="/signup?redirect=/dashboard/affiliate" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-[15px] font-bold bg-gold-bright text-[#060609] no-underline transition-transform duration-200 hover:scale-[1.03]">
              {t.cta.button}
            </Link>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <BrandLink logoSize={24} wordmarkClassName="text-sm" />
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-muted">
              <Link href="/privacy" className="hover:text-gold transition-colors no-underline">Privacy</Link>
              <Link href="/terms" className="hover:text-gold transition-colors no-underline">Terms</Link>
              <Link href="/disclaimer" className="hover:text-gold transition-colors no-underline">Disclaimer</Link>
            </div>
          </div>
          <p className="text-[11px] text-text-muted text-center mt-6">© 2026 Dralvo Capital.</p>
        </div>
      </footer>
    </div>
  );
}
