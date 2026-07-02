"use client";

/**
 * Revenue chime — super-admin only. Polls /api/admin/revenue-events and, when a
 * new payment shows up, plays a cash sound + pops a toast. The first poll only
 * establishes a baseline (no chime for payments that already existed).
 *
 * Mute is controlled by a speaker icon in the admin header (ChimeMuteToggle),
 * stored in localStorage["admin:chimeMuted"] and read fresh at play time.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

interface RevenueEvent {
  id: string;
  at: string;
  source: "Stripe" | "VietQR";
  amount: number;
  currency: "USD" | "VND";
  email: string | null;
}

const POLL_MS = 45_000;
const MUTE_KEY = "admin:chimeMuted";

function fmtAmount(e: RevenueEvent): string {
  return e.currency === "VND" ? `${e.amount.toLocaleString("vi-VN")}₫` : `$${e.amount}`;
}

/** Icon-only speaker toggle — rendered in the admin header next to dark mode. */
export function ChimeMuteToggle() {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") setMuted(window.localStorage.getItem(MUTE_KEY) === "1");
  }, []);
  const toggle = () => {
    setMuted((m) => {
      const next = !m;
      if (typeof window !== "undefined") window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  };
  return (
    <button
      onClick={toggle}
      type="button"
      title={muted ? "Bật âm thông báo tiền về" : "Tắt âm thông báo tiền về"}
      aria-label="Âm thông báo tiền về"
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-text-secondary hover:text-gold hover:border-gold/50 transition-colors cursor-pointer"
    >
      {muted ? <VolumeX size={16} className="text-text-muted" /> : <Volume2 size={16} className="text-green" />}
    </button>
  );
}

export function RevenueChime() {
  const [toasts, setToasts] = useState<RevenueEvent[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const baselined = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/cash.mp3");
      audioRef.current.preload = "auto";
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/revenue-events");
      if (!r.ok) return;
      const d = await r.json();
      const events: RevenueEvent[] = d.events ?? [];

      if (!baselined.current) {
        events.forEach((e) => seen.current.add(e.id));
        baselined.current = true;
        return;
      }

      const fresh = events.filter((e) => !seen.current.has(e.id));
      if (fresh.length === 0) return;
      fresh.forEach((e) => seen.current.add(e.id));
      setToasts((prev) => [...fresh, ...prev].slice(0, 4));

      // Read mute fresh so the header toggle takes effect immediately.
      const muted = typeof window !== "undefined" && window.localStorage.getItem(MUTE_KEY) === "1";
      if (!muted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Autoplay may be blocked until the user interacts with the page.
        });
      }
    } catch {
      // Network hiccup — ignore, next tick retries.
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const dismiss = (eid: string) => setToasts((prev) => prev.filter((t) => t.id !== eid));

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-xl border border-green/40 bg-card px-4 py-3 shadow-lg shadow-black/30 animate-in slide-in-from-right-4"
        >
          <span className="text-2xl leading-none">💰</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green">Tiền về · {fmtAmount(t)}</p>
            <p className="text-[12px] text-text-muted truncate max-w-[220px]">{t.source} — {t.email ?? "—"}</p>
          </div>
          <button onClick={() => dismiss(t.id)} className="ml-1 text-text-muted hover:text-text-primary cursor-pointer border-none bg-transparent" aria-label="Đóng">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
