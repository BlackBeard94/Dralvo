import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-normal text-text-primary mb-4" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
        {title}
      </h2>
      <div className="text-sm text-text-secondary leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function LegalPage({
  badge, title, accent, updated = "06/2026", backLabel = "Trang chủ", updatedLabel = "Cập nhật", children,
}: {
  badge: string; title: string; accent: string;
  updated?: string; backLabel?: string; updatedLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-deep text-text-primary overflow-x-hidden">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" />
        <div className="h1" /><div className="h2" />
      </div>

      <nav className="sticky top-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(212,168,67,0.04)]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline">{backLabel}</Link>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <section className="relative pt-24 pb-10 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[500px] h-[500px] -top-20 -right-20 opacity-40" />
          <div className="max-w-[800px] mx-auto px-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium border border-border text-text-muted mb-8"
              style={{ background: "rgba(26,26,42,0.4)" }}>
              {badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-[-0.015em] text-text-primary mb-4" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
              {title} <span className="text-gold">{accent}</span>
            </h1>
            <p className="text-sm text-text-muted">{updatedLabel}: {updated}</p>
          </div>
        </section>

        <section className="relative pb-20">
          <div className="max-w-[800px] mx-auto px-6">{children}</div>
        </section>
      </main>

      {/* Footer */}
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
    </div>
  );
}
