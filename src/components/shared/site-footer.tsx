import Link from "next/link";

import { DralvoWordmark, LogoMark } from "@/components/shared/brand";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "Methodology", href: "/methodology" },
  { label: "Pricing", href: "/pricing" },
  { label: "Start free", href: "/signup" },
];

const companyLinks = [
  { label: "About", href: "/#about" },
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/signup" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const external = href.startsWith("http");
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-text-secondary hover:text-gold transition-colors no-underline"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="text-sm text-text-secondary hover:text-gold transition-colors no-underline"
    >
      {label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-12 max-md:grid-cols-2 max-sm:grid-cols-1 mb-12">
          <div className="max-sm:col-span-full">
            <div className="flex items-center gap-3 mb-3">
              <LogoMark size={32} />
              <DralvoWordmark className="text-lg" />
            </div>
            <p className="text-sm text-text-muted leading-relaxed max-w-[260px]">
              Gold decision intelligence built from traceable market evidence.
              Informational only, never financial advice.
            </p>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="pt-8 border-t border-border flex items-center justify-between max-sm:flex-col max-sm:gap-4">
          <p className="text-[11px] text-text-muted">
            (c) 2026 Dralvo. All rights reserved.
          </p>
          <a
            href="https://deerflow.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full text-[11px] text-text-muted no-underline transition-all duration-300 hover:border-border-gold hover:text-text-secondary"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Created By Deerflow
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted mb-4">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <FooterLink key={link.label} {...link} />
        ))}
      </div>
    </div>
  );
}
