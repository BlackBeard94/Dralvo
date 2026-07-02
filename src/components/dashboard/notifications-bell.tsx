"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { useNotifications, type Notif } from "@/components/dashboard/notifications-provider";

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const m = Math.floor(diff / 60000);
  if (m < 1) return rtf.format(0, "minute");
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.floor(m / 60);
  if (h < 24) return rtf.format(-h, "hour");
  const d = Math.floor(h / 24);
  if (d < 7) return rtf.format(-d, "day");
  return new Date(iso).toLocaleDateString(locale);
}

/**
 * Per-notification icon + the accent colour used for the icon tile and the
 * unread left-rail, so each level/type reads at a glance.
 */
function notifVisual(n: Notif): { icon: React.ReactNode; accent: string } {
  if (n.type === "alert") {
    const b = n.body ?? "";
    if (b.includes(">") || /above|tăng/i.test(b)) {
      return { icon: <TrendingUp className="h-3.5 w-3.5" />, accent: "green" };
    }
    if (b.includes("<") || /below|giảm/i.test(b)) {
      return { icon: <TrendingDown className="h-3.5 w-3.5" />, accent: "red" };
    }
    return { icon: <Bell className="h-3.5 w-3.5" />, accent: "gold" };
  }
  switch (n.level) {
    case "success":
      return { icon: <CheckCircle2 className="h-3.5 w-3.5" />, accent: "green" };
    case "warning":
    case "alert":
      return { icon: <AlertTriangle className="h-3.5 w-3.5" />, accent: "red" };
    case "promo":
      return { icon: <Sparkles className="h-3.5 w-3.5" />, accent: "gold" };
    default:
      return { icon: <Info className="h-3.5 w-3.5" />, accent: "muted" };
  }
}

const ACCENT_TILE: Record<string, string> = {
  green: "bg-green/10 text-green",
  red: "bg-red/10 text-red",
  gold: "bg-gold/10 text-gold",
  muted: "bg-text-muted/10 text-text-secondary",
};

export function NotificationsBell() {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].notificationsBell;
  const { items, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  function renderRow(n: Notif) {
    const { icon, accent } = notifVisual(n);
    const inner = (
      <>
        {/* Unread accent rail */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 w-0.5 rounded-r",
            !n.read ? "bg-gold" : "bg-transparent",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            ACCENT_TILE[accent] ?? ACCENT_TILE.muted,
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm leading-snug",
                n.read ? "font-normal text-text-secondary" : "font-semibold text-text-primary",
              )}
            >
              {n.title}
            </span>
            {!n.read && (
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            )}
          </span>
          {n.body && (
            <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-text-secondary">
              {n.body}
            </span>
          )}
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-text-muted">
            <Clock className="h-3 w-3" />
            {timeAgo(n.at, locale)}
          </span>
        </span>
      </>
    );
    const cls = cn(
      "relative flex w-full items-start gap-2.5 px-4 py-3 text-left no-underline outline-none transition-colors",
      "hover:bg-gold/5 focus-visible:bg-gold/5 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-gold",
      !n.read && "bg-gold/[0.04]",
    );
    // Clicking a notification opens the notifications page (inbox) where the
    // full message is read. Any deep-link (n.href) stays clickable there — we
    // deliberately don't jump straight to it from the bell.
    return (
      <Link
        href="/dashboard/notifications"
        role="menuitem"
        className={cls}
        onClick={() => {
          markRead(n);
          setOpen(false);
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors",
          "hover:bg-gold/5 hover:text-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
          open && "bg-gold/5 text-text-primary",
        )}
        aria-label={unread > 0 ? c.triggerAriaLabelUnread.replace("{n}", String(unread)) : c.triggerAriaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell size={16} className={cn(open && "text-gold")} />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold leading-none text-white ring-2 ring-surface"
            aria-hidden="true"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={c.panelAriaLabel}
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-border bg-card card-elevate shadow-xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Bell className="h-4 w-4 text-gold" />
              {c.title}
              {unread > 0 && (
                <span className="rounded-full bg-red/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red">
                  {c.unreadBadge.replace("{n}", String(unread))}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-text-muted transition-colors hover:bg-gold/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <Check className="h-3 w-3" />
                {c.markAllRead}
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {c.loading}
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                  <BellOff className="h-6 w-6 text-gold/70" />
                </span>
                <p className="text-sm font-medium text-text-primary">{c.emptyTitle}</p>
                <p className="mx-auto mt-1 max-w-[14rem] text-[11px] leading-snug text-text-muted">
                  {c.emptyBody}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {items.map((n) => (
                  <li key={`${n.type}-${n.id}`}>{renderRow(n)}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border bg-surface/40 px-4 py-2.5 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-text-muted no-underline transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
            >
              {c.viewAll}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
