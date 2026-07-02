import Link from "next/link";

import { DralvoWordmark, LogoMark } from "@/components/shared/brand";
import { InstallAppButton } from "@/components/shared/install-app-button";
import { SocialLinks } from "@/components/shared/social-links";
import { COMMON_COPY } from "@/lib/common-copy";
import type { SupportedLocale } from "@/lib/i18n";

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

/** Marketing footer (columns). Pure presentational — caller supplies the locale
 *  (client via useLocale, server via getServerLocale). */
export function SiteFooter({ locale }: { locale: SupportedLocale }) {
  const f = COMMON_COPY[locale].footer;
  const l = f.links;

  const productLinks = [
    { label: l.blog, href: "/blog" },
    { label: l.methodology, href: "/methodology" },
    { label: l.tigold, href: "/tigold" },
    { label: l.affiliate, href: "/affiliate" },
    { label: l.pricing, href: "/pricing" },
  ];
  const companyLinks = [
    { label: l.trackRecord, href: "/track-record" },
    { label: l.signIn, href: "/login" },
    { label: l.createAccount, href: "/signup" },
  ];
  const legalLinks = [
    { label: l.privacy, href: "/privacy" },
    { label: l.terms, href: "/terms" },
    { label: l.disclaimer, href: "/disclaimer" },
  ];

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
              {f.tagline}
            </p>
            <div className="mt-4 flex flex-nowrap items-center gap-3">
              <InstallAppButton locale={locale} compact />
              <SocialLinks />
            </div>
          </div>

          <FooterColumn title={f.productTitle} links={productLinks} />
          <FooterColumn title={f.companyTitle} links={companyLinks} />
          <FooterColumn title={f.legalTitle} links={legalLinks} />
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-[13px] text-text-muted">{f.rights}</p>
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
      <div className="text-[13px] tracking-[0.15em] uppercase text-text-muted mb-4">
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
