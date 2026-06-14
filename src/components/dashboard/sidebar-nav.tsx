"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DatabaseZap,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/shared/brand";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  labelKey: keyof typeof DASHBOARD_COPY.en.nav;
  icon: LucideIcon;
  href: string;
}

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "drivers", labelKey: "drivers", icon: DatabaseZap, href: "/dashboard/drivers" },
  { id: "alerts", labelKey: "monitors", icon: Bell, href: "/dashboard/alerts" },
  { id: "replay", labelKey: "replay", icon: History, href: "/dashboard/replay" },
  { id: "settings", labelKey: "settings", icon: Settings, href: "/dashboard/settings" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].nav;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-card border-r border-border",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* ── Brand ── */}
      <div
        className={cn(
          "flex items-center h-12 border-b border-border shrink-0",
          collapsed ? "justify-center px-2" : "px-4 gap-3",
        )}
      >
        <LogoMark size={collapsed ? 28 : 32} />
        {!collapsed && (
          <span className="font-display text-lg tracking-[-0.01em] text-text-primary whitespace-nowrap">
            Dral<span className="text-gold italic">vo</span>
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const label = copy[item.labelKey];
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center rounded-md transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3 gap-3",
                    isActive
                      ? "bg-gold/10 text-gold"
                      : "text-text-secondary hover:text-text-primary hover:bg-gold/5",
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gold",
                        collapsed && "left-0.5",
                      )}
                    />
                  )}

                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-colors duration-200",
                      isActive ? "text-gold" : "text-text-muted group-hover:text-text-secondary",
                    )}
                    aria-hidden="true"
                  />

                  {!collapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap truncate">
                      {label}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <span
                      role="tooltip"
                      className={cn(
                        "absolute left-full ml-3 px-2.5 py-1.5 rounded-md whitespace-nowrap",
                        "bg-card border border-border text-text-primary text-xs font-medium",
                        "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                        "transition-[opacity,visibility] duration-150 delay-300",
                        "pointer-events-none z-50",
                        "shadow-lg shadow-black/40",
                      )}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Collapse toggle ── */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center w-full h-9 rounded-md",
            "text-text-muted hover:text-text-primary hover:bg-gold/5",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card",
          )}
          aria-label={collapsed ? copy.expand : copy.collapse}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && (
            <span className="ml-2 text-xs font-medium text-text-muted">
              {copy.collapse}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
