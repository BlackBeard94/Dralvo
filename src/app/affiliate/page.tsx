import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Percent, Clock, Wallet, Repeat } from "lucide-react";

import { SiteNav } from "@/components/shared/site-nav";
import { SiteFooter } from "@/components/shared/site-footer";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { AffiliateReferralTracker } from "@/components/affiliate/affiliate-referral-tracker";
import { getServerLocale } from "@/lib/server-locale";
import { localeDir } from "@/lib/i18n";
import { AFFILIATE_COPY } from "@/lib/affiliate/copy";
import { getAffiliateSettings } from "@/lib/affiliate/settings";
import { substituteAffiliateNumbers } from "@/lib/affiliate/marketing-copy";

export const revalidate = 120;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";
const SERIF = "'DM Serif Display', 'Times New Roman', 'Noto Serif', serif";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const settings = await getAffiliateSettings();
  const t = substituteAffiliateNumbers(AFFILIATE_COPY[locale], settings);
  return {
    title: t.hero.title,
    description: t.hero.subtitle,
    alternates: { canonical: `${SITE}/affiliate` },
    openGraph: {
      title: `${t.hero.title} | Dralvo`,
      description: t.hero.subtitle,
      url: `${SITE}/affiliate`,
      siteName: "Dralvo",
      images: ["/brand/dralvo-og.png"],
    },
    robots: { index: true, follow: true },
  };
}

const ITEM_ICONS = [Percent, Clock, Wallet, Repeat];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-deep/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold">
      {children}
    </span>
  );
}

export default async function AffiliatePage() {
  const locale = await getServerLocale();
  const settings = await getAffiliateSettings();
  const t = substituteAffiliateNumbers(AFFILIATE_COPY[locale], settings);

  return (
    <div dir={localeDir(locale)} className="min-h-dvh overflow-x-hidden bg-deep text-text-primary antialiased">
      <AffiliateReferralTracker />

      <SiteNav locale={locale} activeHref="/affiliate" />

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[620px] h-[620px] -right-40 -top-52 opacity-40" />
          <div className="relative z-10 mx-auto max-w-[820px] px-6 pt-20 pb-16 text-center">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.02em] text-balance" style={{ fontFamily: SERIF }}>
              {t.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-[580px] text-lg leading-relaxed text-text-secondary">{t.hero.subtitle}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup?redirect=/dashboard/affiliate" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-action px-8 py-3.5 text-[15px] font-bold text-[#060609] no-underline transition-transform hover:scale-[1.03]">
                {t.hero.cta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?redirect=/dashboard/affiliate" className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3.5 text-[15px] font-semibold text-text-primary no-underline transition-all hover:border-gold/40 hover:text-gold">
                {t.hero.loginCta}
              </Link>
            </div>
          </div>
        </section>

        {/* Commission stats — dynamic values from admin settings */}
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto max-w-[1120px] px-6 py-16">
            <div className="mx-auto mb-10 max-w-[520px] text-center">
              <Eyebrow>{t.commission.eyebrow}</Eyebrow>
              <h2 className="mt-4 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.commission.title}</h2>
              <p className="mt-3 text-text-secondary">{t.commission.subtitle}</p>
            </div>
            <div className="mx-auto grid max-w-[640px] grid-cols-1 gap-4 sm:grid-cols-3">
              {t.commission.items
                .map((item, i) => ({ item, Icon: ITEM_ICONS[i] ?? Percent, highlight: i === 0 }))
                .filter((_, i) => i !== 1) // ẩn "Cookie" khỏi trang công khai
                .map(({ item, Icon, highlight }) => (
                  <div key={item.label} className={`rounded-2xl border p-5 text-center ${highlight ? "border-border-gold bg-gold/[0.07]" : "border-border bg-card"}`}>
                    <Icon className={`mx-auto mb-3 h-5 w-5 ${highlight ? "text-gold-bright" : "text-text-muted"}`} />
                    <div className={`font-mono text-xl font-bold leading-tight break-words ${highlight ? "text-gold-bright" : "text-text-primary"}`}>{item.value}</div>
                    <div className="mt-1 text-[11px] text-text-muted">{item.label}</div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-[1120px] px-6 py-20">
          <div className="mb-12 text-center">
            <Eyebrow>{t.how.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.how.title}</h2>
          </div>
          <div className="mx-auto grid max-w-[960px] gap-5 md:grid-cols-3">
            {t.how.steps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-border bg-card p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-border-gold bg-gold/10 font-mono text-lg font-bold text-gold">{i + 1}</div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="text-[14px] leading-relaxed text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why partner */}
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto max-w-[1120px] px-6 py-20">
            <div className="mb-12 text-center">
              <Eyebrow>{t.why.eyebrow}</Eyebrow>
              <h2 className="mt-4 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.why.title}</h2>
            </div>
            <div className="mx-auto grid max-w-[860px] gap-4 sm:grid-cols-2">
              {t.why.items.map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-border bg-card p-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green/10 text-green"><Check className="h-3.5 w-3.5" /></span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-primary">{item.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-[760px] px-6 py-20">
          <div className="mb-10 text-center">
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.faq.title}</h2>
          </div>
          <div className="space-y-3">
            {t.faq.items.map(([q, a]) => (
              <details key={q} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-medium text-text-primary [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="text-gold transition-transform group-open:rotate-45">＋</span>
                </summary>
                <p className="px-5 pb-4 text-[14px] leading-relaxed text-text-secondary">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1120px] px-6 pb-24">
          <div className="mx-auto max-w-[760px] rounded-3xl border border-gold/25 p-10 text-center sm:p-14" style={{ background: "linear-gradient(168deg, rgba(212,168,67,0.12), var(--bg-card) 60%)" }}>
            <Eyebrow>{t.cta.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.cta.title}</h2>
            <p className="mx-auto mt-3 mb-8 max-w-[480px] text-text-secondary">{t.cta.body}</p>
            <Link href="/signup?redirect=/dashboard/affiliate" className="inline-flex items-center gap-2 rounded-lg bg-gold-action px-8 py-3.5 text-[15px] font-bold text-[#060609] no-underline transition-transform hover:scale-[1.03]">
              {t.cta.button} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
