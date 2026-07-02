"use client";

/**
 * Backoffice shell — persistent sidebar + top header.
 * Sections are real routes under /admin, so deep-linking and refresh keep the
 * active section. Nav items are gated by the caller's role/permissions.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  DollarSign,
  Megaphone,
  Newspaper,
  Share2,
  Handshake,
  Boxes,
  Bell,
  Webhook,
  BookOpen,
  Shield,
  ArrowLeft,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminPermissions } from "@/lib/admin/types";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RevenueChime, ChimeMuteToggle } from "@/components/admin/revenue-chime";
import { AdminEventsBell } from "@/components/admin/admin-events-bell";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Whether this item is visible for the given role/permissions. */
  show: (role: string, p: AdminPermissions) => boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, show: (r, p) => r === "super_admin" || !!p.users?.view || !!p.finance?.view },
  { href: "/admin/users", label: "Người dùng", icon: Users, show: (_r, p) => !!p.users?.view },
  { href: "/admin/licenses", label: "License", icon: KeyRound, show: (r, p) => r === "super_admin" || !!p.license?.manage },
  { href: "/admin/vault-eas", label: "Kho EA", icon: Boxes, show: (r) => r === "super_admin" },
  { href: "/admin/finance", label: "Tài chính", icon: DollarSign, show: (_r, p) => !!p.finance?.view },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone, show: (r, p) => r === "super_admin" || !!p.marketing?.view },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, show: (r, p) => r === "super_admin" || !!p.marketing?.view },
  { href: "/admin/affiliate", label: "Affiliate", icon: Share2, show: (_r, p) => !!p.affiliate?.manage },
  { href: "/admin/partners", label: "Partner", icon: Handshake, show: (r) => r === "super_admin" },
  { href: "/admin/notifications", label: "Thông báo", icon: Bell, show: () => true },
  { href: "/admin/api-keys", label: "API Keys", icon: Webhook, show: (r) => r === "super_admin" },
  { href: "/admin/docs", label: "Tài liệu", icon: BookOpen, show: () => true },
  { href: "/admin/admins", label: "Quản trị viên", icon: Shield, show: (r) => r === "super_admin" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({
  role,
  permissions,
  email,
  children,
}: {
  role: string;
  permissions: AdminPermissions;
  email?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // super_admin sees everything; otherwise respect the permission predicate.
  const items = NAV.filter((n) => role === "super_admin" || n.show(role, permissions));
  const active = items.find((n) => isActive(pathname, n.href)) ?? items[0];

  // Persist collapse preference.
  useEffect(() => {
    const saved = typeof window !== "undefined" && window.localStorage.getItem("admin:collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("admin:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebar = (mobile: boolean) => (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border shrink-0",
        "transition-[width] duration-300 ease-in-out",
        mobile ? "w-64" : collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center h-14 border-b border-border shrink-0", collapsed && !mobile ? "justify-center px-2" : "px-4 gap-2")}>
        <Shield size={20} className="text-gold shrink-0" />
        {(!collapsed || mobile) && <span className="text-sm font-semibold tracking-tight text-text-primary">Backoffice</span>}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-text-muted hover:text-text-primary cursor-pointer border-none bg-transparent" aria-label="Đóng">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="flex flex-col gap-0.5 px-2">
          {items.map((n) => {
            const Icon = n.icon;
            const act = isActive(pathname, n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={act ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center rounded-md transition-all duration-200 no-underline",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    collapsed && !mobile ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3 gap-3",
                    act ? "bg-gold/10 text-gold nav-lamp" : "text-text-secondary hover:text-text-primary hover:bg-gold/5",
                  )}
                >
                  {act && <span className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gold nav-lamp-bar", collapsed && !mobile && "left-0.5")} />}
                  <Icon size={18} className={cn("shrink-0", act ? "text-gold" : "text-text-muted group-hover:text-text-secondary")} aria-hidden="true" />
                  {(!collapsed || mobile) && <span className="text-[13px] font-medium whitespace-nowrap truncate">{n.label}</span>}
                  {collapsed && !mobile && (
                    <span role="tooltip" className="absolute left-full ml-3 px-2.5 py-1.5 rounded-md whitespace-nowrap bg-card border border-border text-text-primary text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-150 delay-300 pointer-events-none z-50 shadow-lg shadow-black/40">
                      {n.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to app */}
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center rounded-md no-underline shrink-0 border-t border-border text-text-secondary hover:text-text-primary hover:bg-gold/5 transition-colors",
          collapsed && !mobile ? "justify-center h-11" : "h-11 px-3 gap-3",
        )}
      >
        <ArrowLeft size={18} className="shrink-0 text-text-muted" />
        {(!collapsed || mobile) && <span className="text-[13px] font-medium">Về Dashboard</span>}
      </Link>

      {/* User + collapse */}
      <div className={cn("shrink-0 border-t border-border flex items-center", collapsed && !mobile ? "flex-col gap-1 py-2" : "px-3 py-2 gap-2")}>
        {(!collapsed || mobile) && email && (
          <span className="text-[11px] text-text-muted truncate flex-1" title={email}>{email}</span>
        )}
        {!mobile && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors cursor-pointer border-none bg-transparent"
            aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-deep text-text-primary">
      {/* Money-in chime + toasts (super admin only) */}
      {role === "super_admin" && <RevenueChime />}

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
          <h1 className="text-base font-semibold text-text-primary whitespace-nowrap">{active?.label ?? "Backoffice"}</h1>
          <div className="ml-auto flex items-center gap-2">
            <AdminEventsBell />
            <LanguageSwitcher className="h-8 min-w-12" />
            <ThemeToggle className="h-8 w-8" />
            {role === "super_admin" && <ChimeMuteToggle />}
            <span className="hidden sm:inline ml-1 text-[11px] uppercase tracking-[0.08em] text-text-muted">{role}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
