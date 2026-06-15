"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, TrendingUp, TrendingDown, Minus, Clock, Check } from "lucide-react";

type AlertNotification = {
  id: string;
  alert_id: string;
  indicator_key: string;
  indicator_name: string;
  condition_text: string;
  triggered_value: string;
  triggered_at: string;
  read: boolean;
};

type Props = {
  className?: string;
  maxItems?: number;
};

export function AlertNotifications({ className, maxItems = 5 }: Props) {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts/notifications?limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/alerts/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      await fetch("/api/alerts/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayed = notifications.slice(0, maxItems);

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 bg-surface rounded" />
          <div className="h-12 w-full bg-surface rounded" />
          <div className="h-12 w-full bg-surface rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <p className="font-mono text-xs text-red">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-gold" />
          <h3 className="font-display text-base text-text-primary">Recent Alerts</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red px-2 py-0.5 font-mono text-[12px] font-medium text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="font-mono text-[13px] text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="py-6 text-center">
          <Bell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
          <p className="font-mono text-xs text-text-muted">No alerts triggered yet</p>
          <p className="font-mono text-[12px] text-text-muted mt-1">
            Alerts will appear here when your conditions are met
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "group rounded-lg border p-3 transition-all duration-200",
                notif.read
                  ? "border-border/50 bg-surface/30"
                  : "border-gold/20 bg-gold/5 hover:border-gold/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {notif.condition_text.includes(">") || notif.condition_text.includes("above") ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green" />
                    ) : notif.condition_text.includes("<") || notif.condition_text.includes("below") ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-gold" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-mono text-sm text-text-primary truncate">
                      {notif.indicator_name}
                    </p>
                    <p className="font-mono text-xs text-gold mt-0.5">
                      {notif.condition_text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-mono text-xs font-medium text-text-primary">
                        {notif.triggered_value}
                      </span>
                      <span className="font-mono text-[12px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.triggered_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[12px] text-text-muted hover:text-text-primary"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > maxItems && (
        <p className="text-center font-mono text-[13px] text-text-muted">
          +{notifications.length - maxItems} more alerts
        </p>
      )}
    </div>
  );
}

