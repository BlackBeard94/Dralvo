"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
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

type Notif = {
  id: string;
  type: "alert" | "system";
  title: string;
  body: string | null;
  href: string | null;
  level: string;
  at: string;
  read: boolean;
};

function timeAgo(iso: string, locale: string, justNow: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.floor(m / 60);
  if (h < 24) return rtf.format(-h, "hour");
  const d = Math.floor(h / 24);
  if (d < 7) return rtf.format(-d, "day");
  return new Date(iso).toLocaleDateString(locale);
}

function notifVisual(n: Notif): { icon: React.ReactNode; tile: string } {
  if (n.type === "alert") {
    const b = n.body ?? "";
    if (b.includes(">") || /above|tăng/i.test(b)) return { icon: <TrendingUp className="h-4 w-4" />, tile: "bg-green/10 text-green" };
    if (b.includes("<") || /below|giảm/i.test(b)) return { icon: <TrendingDown className="h-4 w-4" />, tile: "bg-red/10 text-red" };
    return { icon: <Bell className="h-4 w-4" />, tile: "bg-gold/10 text-gold" };
  }
  switch (n.level) {
    case "success":
      return { icon: <CheckCircle2 className="h-4 w-4" />, tile: "bg-green/10 text-green" };
    case "warning":
      return { icon: <AlertTriangle className="h-4 w-4" />, tile: "bg-red/10 text-red" };
    case "promo":
      return { icon: <Sparkles className="h-4 w-4" />, tile: "bg-gold/10 text-gold" };
    default:
      return { icon: <Info className="h-4 w-4" />, tile: "bg-text-muted/10 text-text-secondary" };
  }
}

type Filter = "all" | "unread";

export function NotificationsInbox() {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].notificationsInbox;
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications", { cache: "no-store" });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      /* keep last known */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = items.filter((n) => !n.read).length;
  const shown = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter],
  );

  const markRead = useCallback((n: Notif) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    void fetch("/api/user/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id, type: n.type }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    if (items.every((n) => n.read)) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    void fetch("/api/user/notifications/read-all", { method: "POST" }).catch(() => {});
  }, [items]);

  function renderRow(n: Notif) {
    const { icon, tile } = notifVisual(n);
    const body = (
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tile)}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={cn("text-sm leading-snug", n.read ? "text-text-secondary" : "font-semibold text-text-primary")}>
              {n.title}
            </p>
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-text-muted">
              <Clock className="h-3 w-3" />
              {timeAgo(n.at, locale, c.justNow)}
            </span>
          </div>
          {n.body && <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{n.body}</p>}
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted">
              {n.type === "alert" ? c.badgeAlert : c.badgeSystem}
            </span>
            {n.href && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-gold">
                {c.open} <ArrowUpRight className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />}
      </div>
    );
    const cls = cn(
      "block w-full rounded-xl border px-4 py-3.5 text-left no-underline transition-colors",
      n.read ? "border-border bg-card" : "border-gold/25 bg-gold/[0.04]",
      "hover:border-border-strong",
    );
    return n.href ? (
      <Link href={n.href} className={cls} onClick={() => markRead(n)}>
        {body}
      </Link>
    ) : (
      <button type="button" className={cls} onClick={() => markRead(n)}>
        {body}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text-primary">{c.title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {c.subtitle}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-gold px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/10 transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> {c.markAllRead}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {(["all", "unread"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              filter === f ? "bg-gold/10 text-gold" : "text-text-muted hover:text-text-primary",
            )}
          >
            {f === "all" ? c.filterAll : `${c.filterUnread}${unread ? ` (${unread})` : ""}`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> {c.loading}
        </div>
      ) : shown.length === 0 ? (
        <div className="card-elevate rounded-2xl border border-border bg-card py-16 text-center">
          <BellOff className="mx-auto mb-3 h-9 w-9 text-text-muted opacity-40" />
          <p className="text-sm text-text-secondary">
            {filter === "unread" ? c.emptyUnread : c.emptyAll}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {c.emptyHint}
          </p>
        </div>
      ) : (
        <div className="space-y-2">{shown.map((n) => <div key={`${n.type}-${n.id}`}>{renderRow(n)}</div>)}</div>
      )}
    </div>
  );
}
