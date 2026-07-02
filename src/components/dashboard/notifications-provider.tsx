"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "@/hooks/use-locale";

export type Notif = {
  id: string;
  type: "alert" | "system";
  title: string;
  body: string | null;
  href: string | null;
  level: string;
  at: string;
  read: boolean;
  showInTicker?: boolean;
  // Per-locale overrides (admin-entered). Resolved against the viewer's locale
  // below, with title/body as the fallback for any locale not translated.
  titleI18n?: Record<string, string> | null;
  bodyI18n?: Record<string, string> | null;
};

type NotificationsCtx = {
  items: Notif[];
  loading: boolean;
  markRead: (n: Notif) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsCtx | null>(null);
const POLL_MS = 60_000;

/**
 * Single source of truth for the user's notifications. The bell and the ticker
 * both read from here so we fetch `/api/user/notifications` ONCE (not twice) and
 * poll it once — paused while the tab is hidden.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocale();

  // Resolve each notification's title/body to the viewer's locale (fallback to
  // the base title/body). Recomputes instantly when the user switches language.
  const localized = useMemo(
    () =>
      items.map((n) => ({
        ...n,
        title: n.titleI18n?.[locale]?.trim() || n.title,
        body: n.bodyI18n?.[locale]?.trim() || n.body,
      })),
    [items, locale],
  );

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      /* keep last known */
    } finally {
      setLoading(false);
    }
  }, []);

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const start = () => {
      if (timer.current == null) timer.current = window.setInterval(fetchNotifs, POLL_MS);
    };
    const stop = () => {
      if (timer.current != null) {
        window.clearInterval(timer.current);
        timer.current = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchNotifs();
        start();
      } else {
        stop();
      }
    };

    void fetchNotifs();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchNotifs]);

  const markRead = useCallback((n: Notif) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id && x.type === n.type ? { ...x, read: true } : x)));
    void fetch("/api/user/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id, type: n.type }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => (prev.every((n) => n.read) ? prev : prev.map((n) => ({ ...n, read: true }))));
    void fetch("/api/user/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <NotificationsContext.Provider value={{ items: localized, loading, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsCtx {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
