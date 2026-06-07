import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { SiteFooter } from "@/components/shared/site-footer";

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl text-text-primary mb-5 tracking-[-0.01em]">
        {title}
      </h2>
      <div className="text-sm text-text-secondary leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({
  badge,
  title,
  accent,
  updated = "June 2026",
  children,
}: {
  badge: string;
  title: string;
  accent: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-deep text-text-primary overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-deep/80 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(212,168,67,0.05)]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-gold transition-colors no-underline tracking-[0.02em]"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative pt-20 pb-12 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[500px] h-[500px] -top-20 -right-20" />
          <div className="max-w-[800px] mx-auto px-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-border-gold rounded-full text-[11px] tracking-[0.15em] uppercase text-gold mb-8 bg-gold/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {badge}
            </div>
            <h1 className="font-display text-[clamp(40px,6vw,64px)] font-normal leading-[1.1] tracking-[-0.02em] text-text-primary mb-4">
              {title} <span className="text-gold italic">{accent}</span>
            </h1>
            <p className="text-text-muted text-sm">Last updated: {updated}</p>
          </div>
        </section>

        <section className="relative pb-24">
          <div className="max-w-[800px] mx-auto px-6">{children}</div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
