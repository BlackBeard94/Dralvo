"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface NavLink {
  label: string;
  href: string;
  /** "sm" = visible ≥640px, "md" = visible ≥768px, undefined = always visible */
  showFrom?: "sm" | "md";
  /** Override default text-muted color */
  className?: string;
  style?: React.CSSProperties;
  /** Separator before this link? */
  separatorBefore?: boolean;
}

export interface NavBarProps {
  /** Nav links (home link auto-added as first item if not included) */
  links?: NavLink[];
  /** Always-visible action buttons on the right */
  actions?: React.ReactNode;
  /** Extra items after actions (language, theme already included) */
  extras?: React.ReactNode;
  /** Show language switcher (default: true) */
  showLanguage?: boolean;
  /** Show theme toggle (default: true) */
  showTheme?: boolean;
  /** cn() class for the <nav> wrapper */
  navClassName?: string;
  /** Brand wordmark class override */
  wordmarkClassName?: string;
  /** Container class ("max-w-[1180px] mx-auto px-6" or "px-6") */
  containerClassName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Separator                                                                 */
/* -------------------------------------------------------------------------- */

function Sep({ showFrom }: { showFrom?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "text-border mx-0.5",
        showFrom === "sm" && "hidden sm:inline",
        showFrom === "md" && "hidden md:inline",
      )}
    >
      |
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function NavBar({
  links = [],
  actions,
  extras,
  showLanguage = true,
  showTheme = true,
  navClassName,
  wordmarkClassName = "text-2xl font-black transition-colors",
  containerClassName = "max-w-[1180px] mx-auto px-6",
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border",
        navClassName,
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center justify-between gap-2",
          containerClassName,
        )}
      >
        {/* Left: brand */}
        <BrandLink wordmarkClassName={wordmarkClassName} />

        {/* Center: nav links (desktop) */}
        <div className="hidden md:flex items-center gap-0 whitespace-nowrap">
          {links.map((link, i) => (
            <span key={link.href} className="contents">
              {link.separatorBefore && <Sep />}
              <Link
                href={link.href}
                className={cn(
                  "text-[13px] hover:text-gold transition-colors no-underline px-2",
                  !link.className && "text-text-muted",
                  link.showFrom === "sm" && "hidden sm:inline",
                  link.showFrom === "md" && "hidden md:inline",
                  link.className,
                )}
                style={link.style}
              >
                {link.label}
              </Link>
              {i < links.length - 1 && !links[i + 1]?.separatorBefore && (
                <Sep showFrom={link.showFrom} />
              )}
            </span>
          ))}
        </div>

        {/* Right: actions + utilities */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          {/* Actions — desktop only, mobile via dropdown */}
          <div className="hidden sm:flex items-center gap-2">{actions}</div>
          {extras}
          {showLanguage && (
            <LanguageSwitcher className="hidden sm:flex" />
          )}
          {showTheme && <ThemeToggle className="hidden sm:flex" />}

          {/* Hamburger (mobile) */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:text-gold hover:bg-gold/5 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface animate-slide-down">
          <div className="px-6 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block py-2.5 text-[14px] no-underline border-b border-border/50 last:border-b-0",
                  link.className?.includes("text-gold")
                    ? "text-gold font-medium"
                    : "text-text-primary hover:text-gold transition-colors",
                )}
                style={link.style}
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile language + theme */}
            <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border">
              {showLanguage && <LanguageSwitcher />}
              {showTheme && <ThemeToggle />}
            </div>
            {/* Mobile CTA actions — full-width touch targets */}
            {actions && (
              <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-border [&>a]:block [&>a]:w-full [&>a]:py-2.5 [&>a]:rounded-lg [&>a]:text-center [&>a]:text-sm [&>a]:font-semibold [&>a]:no-underline">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
