"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, Mail, Check, Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

type NotificationPrefs = {
  email: boolean;
  telegram: boolean;
  in_app: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = { email: true, telegram: false, in_app: true };

const CHANNELS: {
  key: "in_app" | "email";
  icon: typeof Mail;
}[] = [
  { key: "in_app", icon: Bell },
  { key: "email", icon: Mail },
];

function Switch({ active, onChange, label }: { active: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card",
        active ? "bg-green" : "bg-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          active ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function NotificationPreferences({ className }: { className?: string }) {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].notificationPrefs;
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/user/preferences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.notification_prefs) setPrefs({ ...DEFAULT_PREFS, ...d.notification_prefs });
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Auto-save on every toggle — no separate "Save" step to forget.
  const persist = useCallback(async (next: NotificationPrefs) => {
    setSaving(true);
    setSavedTick(false);
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_prefs: next }),
      });
      setSavedTick(true);
      window.setTimeout(() => setSavedTick(false), 1800);
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }, []);

  const togglePref = (key: "in_app" | "email") => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      void persist(next);
      return next;
    });
  };

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-surface/60 p-5", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-surface" />
          <div className="h-10 w-full rounded bg-surface" />
          <div className="h-10 w-full rounded bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-elevate rounded-2xl border border-border bg-surface/60 p-5", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold" />
          <h3 className="font-display text-base text-text-primary">{c.title}</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> {c.saving}
            </>
          ) : savedTick ? (
            <>
              <Check className="h-3 w-3 text-green" /> {c.saved}
            </>
          ) : (
            c.autoSave
          )}
        </span>
      </div>

      {/* Channels — each auto-saves on toggle */}
      <div className="divide-y divide-border/60">
        {CHANNELS.map(({ key, icon: Icon }) => {
          const label = key === "in_app" ? c.inAppLabel : c.emailLabel;
          const desc = key === "in_app" ? c.inAppDesc : c.emailDesc;
          return (
            <div key={key} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold/20 bg-gold/10 text-gold">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">{label}</p>
                  <p className="text-[12px] text-text-muted">{desc}</p>
                </div>
              </div>
              <Switch active={prefs[key]} onChange={() => togglePref(key)} label={label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
