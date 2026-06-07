"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, Sun, Moon } from "lucide-react";

import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface DashboardShellProps {
  children: React.ReactNode;
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

export function DashboardShell({ children }: DashboardShellProps) {
  /* ---- sidebar state ---- */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* ---- theme ---- */
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
      if (stored === "light") setTheme("light");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  /* ---- clock ---- */
  const [timeString, setTimeString] = useState(() => formatUTCTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTimeString(formatUTCTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- close mobile sidebar on route change (handled via overlay click) ---- */
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

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
    <div className="flex h-screen overflow-hidden bg-deep">
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex h-full shrink-0">
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
          />
          {/* Drawer */}
          <div className="relative z-50 h-full w-60 animate-slide-in-left">
            <SidebarNav collapsed={false} onToggle={closeMobileSidebar} />
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
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Center: page title / breadcrumb */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-text-muted tracking-wider uppercase select-none">
              Dashboard
            </span>
          </div>

          {/* Right: status, clock, theme */}
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
              </span>
              <span className="text-[11px] text-text-muted font-medium tracking-wider uppercase">
                Live
              </span>
            </div>

            {/* UTC clock */}
            <time
              className="text-xs font-mono text-text-secondary tabular-nums select-none"
              dateTime={new Date().toISOString()}
              suppressHydrationWarning
            >
              {timeString} UTC
            </time>

            {/* Theme toggle */}
            <button
              type="button"
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md",
                "text-text-muted hover:text-gold hover:bg-gold/5",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              )}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
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
