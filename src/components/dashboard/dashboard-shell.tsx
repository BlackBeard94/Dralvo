"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MarketHeader } from "@/components/dashboard/market-header";
import { ProductAnalyticsTracker } from "@/components/dashboard/product-analytics-tracker";
import { AffiliateConversionTracker } from "@/components/affiliate/affiliate-conversion-tracker";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  planTier?: string;
  planStatus?: string;
  isAdmin?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatUTCTime(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function DashboardShell({
  children,
  userEmail,
  planTier = "Free",
  planStatus = "free",
  isAdmin = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const navCopy = DASHBOARD_COPY[locale].nav;
  const pageTitle = pathname.startsWith("/dashboard/drivers")
    ? navCopy.drivers
    : pathname.startsWith("/dashboard/alerts")
      ? navCopy.monitors
      : pathname.startsWith("/dashboard/replay")
        ? navCopy.replay
        : pathname.startsWith("/dashboard/settings")
          ? navCopy.settings
          : pathname.startsWith("/dashboard/chart")
            ? navCopy.chart
            : navCopy.dashboard;

  /* ---- sidebar state ---- */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* ---- clock ---- */
  const [now, setNow] = useState(() => new Date());
  const timeString = formatUTCTime(now);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- close mobile sidebar on route change (handled via overlay click) ---- */
  const closeMobileSidebar = useCallback(
    () => setMobileSidebarOpen(false),
    [],
  );

  /* ---- keyboard shortcut: Ctrl+B toggles sidebar ---- */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-deep">
      <ProductAnalyticsTracker />
      <AffiliateConversionTracker />
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex h-full shrink-0">
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          isAdmin={isAdmin}
          userEmail={userEmail}
          planTier={planTier}
          planStatus={planStatus}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={closeMobileSidebar}
            aria-label={navCopy.closeSidebar}
          />
          {/* Drawer */}
          <div className="relative z-50 h-full w-60 animate-slide-in-left">
            <SidebarNav collapsed={false} onToggle={closeMobileSidebar} isAdmin={isAdmin} userEmail={userEmail} planTier={planTier} planStatus={planStatus} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ── Top status bar ── */}
        <header
          className={cn(
            "flex items-center h-12 shrink-0 bg-surface border-b border-border px-4 gap-3",
          )}
        >
          {/* Left: hamburger (mobile) */}
          <button
            type="button"
            className={cn(
              "md:hidden flex items-center justify-center w-8 h-8 rounded-md",
              "text-text-secondary hover:text-text-primary hover:bg-gold/5",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            )}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label={navCopy.openSidebar}
          >
            <Menu size={18} />
          </button>

          {/* Center: page title / breadcrumb */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-text-muted tracking-wider uppercase select-none">
              {pageTitle}
            </span>
          </div>

          {/* Right: status, clock, language, theme, user */}
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
              </span>
              <span className="text-[13px] text-text-muted font-medium tracking-wider uppercase">
                {navCopy.live}
              </span>
            </div>

            {/* UTC clock */}
            <time
              className="hidden sm:block text-xs font-mono text-text-secondary tabular-nums select-none"
              dateTime={now.toISOString()}
              suppressHydrationWarning
            >
              {timeString} UTC
            </time>

            <LanguageSwitcher className="h-8 min-w-12" />
            <ThemeToggle className="h-8 w-8" />
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4">
          <MarketHeader />
          {children}
        </main>
      </div>

      {/* ── Slide-in animation for mobile sidebar ── */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slideInLeft 250ms ease-out;
        }
      `}</style>
    </div>
  );
}
