"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Server,
  Settings,
  Share2,
  Shield,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DralvoWordmark, LogoMark } from "@/components/shared/brand";
import { UserMenu } from "@/components/dashboard/user-menu";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
  userEmail?: string | null;
  planTier?: string;
  planStatus?: string;
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
  { id: "kho", labelKey: "kho", icon: Package, href: "/dashboard/kho" },
  { id: "affiliate", labelKey: "affiliate", icon: Share2, href: "/dashboard/affiliate" },
];

const EXTERNAL_LINKS = [
  { label: "Mua VPS", icon: Server, href: "https://my.gencloud.vn/aff.php?aff=79" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function SidebarNav({ collapsed, onToggle, isAdmin = false, userEmail, planTier, planStatus }: SidebarNavProps) {
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
          <DralvoWordmark className="whitespace-nowrap text-lg" />
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
            {/* Admin link — only if user is admin */}
            {isAdmin && (
              <li>
                <Link
                  href="/dashboard/admin"
                  className={cn(
                    "group relative flex items-center rounded-md transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3 gap-3",
                    pathname.startsWith("/dashboard/admin")
                      ? "bg-gold/10 text-gold"
                      : "text-text-secondary hover:text-text-primary hover:bg-gold/5",
                  )}
                >
                  {pathname.startsWith("/dashboard/admin") && (
                    <span className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gold",
                      collapsed && "left-0.5",
                    )} />
                  )}
                  <Shield size={18} className={cn(
                    "shrink-0 transition-colors duration-200",
                    pathname.startsWith("/dashboard/admin") ? "text-gold" : "text-text-muted group-hover:text-text-secondary",
                  )} aria-hidden="true" />
                  {!collapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap truncate">Admin</span>
                  )}
                  {collapsed && (
                    <span role="tooltip" className="absolute left-full ml-3 px-2.5 py-1.5 rounded-md whitespace-nowrap bg-card border border-border text-text-primary text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-150 delay-300 pointer-events-none z-50 shadow-lg shadow-black/40">
                      Admin
                    </span>
                  )}
                </Link>
              </li>
            )}
          </ul>

          {/* External links */}
          <div className="mt-2 px-2 border-t border-border pt-2">
            {EXTERNAL_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group relative flex items-center rounded-md transition-all duration-200 no-underline",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3 gap-3",
                    "text-text-secondary hover:text-text-primary hover:bg-gold/5",
                  )}
                >
                  <Icon size={18} className="shrink-0 text-text-muted group-hover:text-text-secondary" aria-hidden="true" />
                  {!collapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap truncate">{link.label}</span>
                  )}
                  {collapsed && (
                    <span role="tooltip"
                      className="absolute left-full ml-3 px-2.5 py-1.5 rounded-md whitespace-nowrap bg-card border border-border text-text-primary text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-150 delay-300 pointer-events-none z-50 shadow-lg shadow-black/40">
                      {link.label}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
      </nav>

      {/* ── Collapse toggle — right edge ── */}
      <div className="shrink-0 border-t border-border py-1.5 flex justify-end px-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors cursor-pointer"
          aria-label={collapsed ? copy.expand : copy.collapse}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Settings link — bottom ── */}
      <Link
        href="/dashboard/settings"
        className={cn(
          "flex items-center rounded-md transition-all duration-200 no-underline shrink-0 border-t border-border",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          collapsed ? "justify-center h-10 mx-1.5 mb-1" : "h-10 px-3 mx-2 gap-3 mb-1",
          "text-text-secondary hover:text-text-primary hover:bg-gold/5",
        )}
      >
        <Settings size={18} className="shrink-0 text-text-muted" />
        {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap truncate">{copy.settings}</span>}
      </Link>

      {/* ── User — bottom left ── */}
      {userEmail && (
        <div className={cn("shrink-0 border-t border-border", collapsed ? "p-1.5 flex justify-center" : "px-3 py-2")}>
          <UserMenu userEmail={userEmail} planTier={planTier ?? "Free"} planStatus={planStatus} />
        </div>
      )}
    </aside>
  );
}
