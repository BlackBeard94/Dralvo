"use client";

/**
 * Admin event bell — polls /api/admin/events and shows a red unread badge.
 * "Unread" = events newer than the last time the bell was opened
 * (localStorage "admin:eventsSeen"). Opening the panel marks all as seen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, UserPlus, Share2, DollarSign, Handshake, Wallet, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AdminEvent {
  id: string;
  type: string;
  title: string;
  message: string | null;
  created_at: string;
}

const SEEN_KEY = "admin:eventsSeen";
const MUTE_KEY = "admin:chimeMuted";
const POLL_MS = 60_000;

/** Short two-note "pip pip" via WebAudio — no audio asset needed. */
function playPip(ctxRef: { current: AudioContext | null }) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MUTE_KEY) === "1") return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = ctxRef.current ?? (ctxRef.current = new Ctor());
    if (ctx.state === "suspended") void ctx.resume();
    const beep = (freq: number, at: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.14);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.16);
    };
    beep(880, 0);
    beep(1175, 0.16);
  } catch {
    /* autoplay blocked / no audio — silent */
  }
}

const ICON: Record<string, LucideIcon> = {
  user_signup: UserPlus,
  affiliate_signup: Share2,
  payment_success: DollarSign,
  partner_created: Handshake,
  payout_request: Wallet,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function AdminEventsBell() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastMaxRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLastSeen(Number(window.localStorage.getItem(SEEN_KEY) ?? "0"));
    }
  }, []);

  const load = useCallback(() => {
    fetch("/api/admin/events")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => {
        const list: AdminEvent[] = d.events ?? [];
        setEvents(list);
        const newest = list.reduce((mx, e) => Math.max(mx, new Date(e.created_at).getTime()), 0);
        // First poll establishes the baseline silently; later polls pip on anything newer.
        if (lastMaxRef.current !== null && newest > lastMaxRef.current) {
          playPip(audioCtxRef);
        }
        lastMaxRef.current = newest;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Unlock WebAudio on the first user gesture so later auto-pips can play.
  useEffect(() => {
    const unlock = () => {
      try {
        const Ctor =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor && !audioCtxRef.current) audioCtxRef.current = new Ctor();
        if (audioCtxRef.current?.state === "suspended") void audioCtxRef.current.resume();
      } catch {
        /* ignore */
      }
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = events.filter((e) => new Date(e.created_at).getTime() > lastSeen).length;

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) {
        const now = Date.now();
        setLastSeen(now);
        if (typeof window !== "undefined") window.localStorage.setItem(SEEN_KEY, String(now));
      }
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        type="button"
        aria-label="Thông báo"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-text-secondary hover:text-gold hover:border-gold/50 transition-colors cursor-pointer"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card shadow-xl shadow-black/40 z-[60]">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">Thông báo</span>
            <span className="text-[11px] text-text-muted">{events.length} sự kiện</span>
          </div>
          {events.length === 0 ? (
            <p className="px-4 py-8 text-center text-text-muted text-sm">Chưa có sự kiện nào.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => {
                const Icon = ICON[e.type] ?? Circle;
                return (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold/10 text-gold shrink-0">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-text-primary truncate">{e.title}</p>
                      {e.message && <p className="text-[12px] text-text-muted truncate">{e.message}</p>}
                      <p className="text-[11px] text-text-muted mt-0.5">{timeAgo(e.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
