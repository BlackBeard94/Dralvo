"use client";

import Link from "next/link";
import { Crown, Megaphone } from "lucide-react";

import { useNotifications } from "@/components/dashboard/notifications-provider";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

/**
 * Thin marquee bar that scrolls messages right→left. Sits just under the header
 * and doubles as the system-notification strip — push more strings into `items`
 * (e.g. from an alerts feed) and they join the scroll.
 */
export interface NotificationTickerProps {
  items: string[];
  tone?: "vip" | "free";
  action?: { label: string; href: string };
}

export function NotificationTicker({ items, tone = "free", action }: NotificationTickerProps) {
  // Live system notifications (from the shared provider — one poll for the whole
  // dashboard) scroll alongside the static status messages.
  const { items: notifs } = useNotifications();
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].notificationTicker;
  const sysMessages = notifs
    .filter((n) => n.type === "system" && n.showInTicker !== false)
    .map((n) => (n.body ? `${n.title} — ${n.body}` : n.title));

  const messages = [...sysMessages, ...items.filter(Boolean)];
  if (messages.length === 0) return null;

  const isVip = tone === "vip";
  const accent = isVip ? "var(--gold-bright)" : "var(--green)";
  const Icon = isVip ? Crown : Megaphone;

  return (
    <div
      className="group flex w-full shrink-0 items-center gap-3 overflow-hidden border-b px-4 py-1.5"
      style={{
        borderColor: isVip ? "var(--border-gold)" : "rgba(46,189,133,0.30)",
        background: isVip ? "var(--gold-ghost)" : "rgba(46,189,133,0.06)",
      }}
      role="status"
      aria-label={isVip ? c.ariaLabelVip : c.ariaLabelFree}
    >
      {/* Fixed badge — pill so it reads clearly on white and dark alike */}
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none"
        style={{
          color: accent,
          background: isVip ? "var(--gold-ghost)" : "rgba(46,189,133,0.10)",
        }}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{isVip ? "Dralvo VIP" : "Dralvo Free"}</span>
      </span>

      {/* Marquee — two identical halves, parent slides -50% for a seamless loop.
          The viewport gets an edge fade so messages dissolve in/out at the ends. */}
      <div className="marquee-fade relative min-w-0 flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex items-center gap-8 whitespace-nowrap pr-8"
              aria-hidden={copy === 1}
            >
              {messages.map((text, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: accent }}
                    aria-hidden="true"
                  />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {action && (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center rounded-md px-3 py-1 text-xs font-semibold no-underline transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          style={{ background: "var(--gold-action)", color: "#060609" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
