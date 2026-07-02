"use client";

/**
 * Partner portal shell — minimal sidebar + top header.
 * Scoped to the logged-in reseller only. Styling modeled on the admin shell
 * but intentionally standalone (no admin imports). Sections are real routes
 * under /partner so deep-linking and refresh keep the active section.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Users,
  Megaphone,
  ArrowLeft,
  Menu,
  X,
  Handshake,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/partner", label: "Doanh thu", icon: Wallet },
  { href: "/partner/customers", label: "Khách hàng", icon: Users },
  { href: "/partner/marketing", label: "Marketing", icon: Megaphone },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/partner" ? pathname === "/partner" : pathname.startsWith(href);
}

export function PartnerShell({
  name,
  code,
  children,
}: {
  name?: string | null;
  code: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = NAV.find((n) => isActive(pathname, n.href)) ?? NAV[0];

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebar = (mobile: boolean) => (
    <aside className="flex flex-col h-full bg-card border-r border-border shrink-0 w-60">
      {/* Brand */}
      <div className="flex items-center h-14 border-b border-border shrink-0 px-4 gap-2">
        <Handshake size={20} className="text-gold shrink-0" />
        <span className="text-sm font-semibold tracking-tight text-text-primary">Partner</span>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-text-muted hover:text-text-primary cursor-pointer border-none bg-transparent"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="flex flex-col gap-0.5 px-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const act = isActive(pathname, n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={act ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center rounded-md transition-all duration-200 no-underline h-10 px-3 gap-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    act ? "bg-gold/10 text-gold" : "text-text-secondary hover:text-text-primary hover:bg-gold/5",
                  )}
                >
                  {act && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gold" />}
                  <Icon size={18} className={cn("shrink-0", act ? "text-gold" : "text-text-muted group-hover:text-text-secondary")} aria-hidden="true" />
                  <span className="text-[13px] font-medium whitespace-nowrap truncate">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to app */}
      <Link
        href="/dashboard"
        className="flex items-center rounded-md no-underline shrink-0 border-t border-border text-text-secondary hover:text-text-primary hover:bg-gold/5 transition-colors h-11 px-3 gap-3"
      >
        <ArrowLeft size={18} className="shrink-0 text-text-muted" />
        <span className="text-[13px] font-medium">Về Dashboard</span>
      </Link>

      {/* Partner identity */}
      <div className="shrink-0 border-t border-border px-3 py-2.5">
        {name && <p className="text-[12px] font-medium text-text-primary truncate" title={name}>{name}</p>}
        <p className="text-[11px] text-text-muted font-mono">#{code}</p>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-deep text-text-primary">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{sidebar(false)}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full">{sidebar(true)}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center gap-3 h-14 border-b border-border px-4 shrink-0 bg-card/40 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-text-muted hover:text-text-primary cursor-pointer border-none bg-transparent"
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold text-text-primary">{active?.label ?? "Partner"}</h1>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher className="h-8 min-w-12" />
            <ThemeToggle className="h-8 w-8" />
            <span className="hidden sm:inline ml-1 text-[11px] uppercase tracking-[0.08em] text-text-muted">Đối tác</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
