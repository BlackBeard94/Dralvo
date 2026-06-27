"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, X, ShieldCheck, AlertTriangle } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import { COMPARE_COPY } from "@/lib/compare-copy";

const SERIF = "'DM Serif Display', 'Times New Roman', serif";

function Cell({ children, good }: { children: React.ReactNode; good: boolean }) {
  return (
    <td className="align-top p-4 border-t border-border">
      <div className="flex items-start gap-2.5">
        {good ? (
          <Check size={16} className="shrink-0 mt-0.5 text-green" />
        ) : (
          <X size={16} className="shrink-0 mt-0.5 text-red" />
        )}
        <span className={good ? "text-text-primary" : "text-text-secondary"}>{children}</span>
      </div>
    </td>
  );
}

export function CompareContent() {
  const { locale } = useLocale();
  const t = COMPARE_COPY[locale];

  return (
    <main className="min-h-screen bg-deep text-text-primary antialiased px-6 py-16">
      <div className="max-w-[920px] mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-gold no-underline mb-8">
          <ArrowLeft size={14} /> {t.back}
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium border border-border text-text-muted mb-5">
            {t.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal tracking-[-0.015em] text-balance" style={{ fontFamily: SERIF }}>
            {t.h1}
          </h1>
          <p className="text-text-secondary mt-5 max-w-[680px] leading-relaxed">{t.intro}</p>
        </header>

        <section className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-[13.5px] min-w-[640px]">
            <thead>
              <tr className="text-left">
                <th className="p-4 font-medium text-text-muted text-[11px] uppercase tracking-[0.05em] w-[28%]">{t.th.dim}</th>
                <th className="p-4 font-semibold text-text-secondary w-[36%]">
                  <span className="inline-flex items-center gap-1.5"><AlertTriangle size={14} className="text-red" /> {t.th.grid}</span>
                </th>
                <th className="p-4 font-semibold text-gold-bright w-[36%]">
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-gold-bright" /> {t.th.dralvo}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r) => (
                <tr key={r.dim}>
                  <td className="align-top p-4 border-t border-border text-text-muted font-medium">{r.dim}</td>
                  <Cell good={false}>{r.grid}</Cell>
                  <Cell good>{r.dralvo}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-normal tracking-[-0.01em] mb-4" style={{ fontFamily: SERIF }}>{t.whyTitle}</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed text-[14.5px]">
            {t.whyParas.map((para, i) => (
              <p key={i}>
                {para}
                {i === t.whyParas.length - 1 && (
                  <> <Link href="/track-record" className="text-gold hover:text-gold-bright">{t.ctaBacktest} →</Link></>
                )}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-normal tracking-[-0.01em] mb-5" style={{ fontFamily: SERIF }}>{t.faqTitle}</h2>
          <div className="space-y-5">
            {t.faq.map(([q, a]) => (
              <div key={q} className="border border-border rounded-lg p-5 bg-card">
                <h3 className="text-[15px] font-semibold mb-2">{q}</h3>
                <p className="text-[13.5px] text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-wrap gap-3">
          <Link href="/track-record" className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-[#060609] no-underline" style={{ background: "var(--gold-bright)" }}>
            {t.ctaBacktest} <ArrowRight size={16} />
          </Link>
          <Link href="/tigold" className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold border border-border text-gold no-underline hover:bg-gold/5">
            {t.ctaTigold}
          </Link>
        </section>

        <p className="text-[11px] text-text-muted mt-12 leading-relaxed">{t.disclaimer}</p>
      </div>
    </main>
  );
}
