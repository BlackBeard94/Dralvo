"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import { withLocaleFallback } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Support/contact Telegram link. Override per-deploy with the env var.
const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL || "https://t.me/dralvo_bot";

const COPY = withLocaleFallback({
  en: { aria: "Chat with support on Telegram", label: "Chat with Dralvo" },
  vi: { aria: "Chat hỗ trợ qua Telegram", label: "Chat với Dralvo" },
  "pt-BR": {
    aria: "Fale com o suporte no Telegram",
    label: "Fale com a Dralvo",
  },
  es: { aria: "Chatea con soporte en Telegram", label: "Chatea con Dralvo" },
  id: { aria: "Chat dukungan via Telegram", label: "Chat dengan Dralvo" },
  ar: { aria: "الدردشة مع الدعم عبر تيليجرام", label: "تحدث مع Dralvo" },
});

/**
 * Floating "chat with us" button → opens Telegram support. Zero infra, fits the
 * trader audience already on Telegram. Site-wide (mounted in the root layout).
 *
 * Auto-hides while the user is actively scrolling (so it never sits on top of
 * content the user is reading) and slides back in a moment after scrolling
 * stops. Compact enough not to dominate small screens, but still a comfortable
 * 48px tap target.
 */
export function TelegramChatButton() {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setHidden(true);
      if (timer.current) clearTimeout(timer.current);
      // Reveal again shortly after the user stops scrolling.
      timer.current = setTimeout(() => setHidden(false), 450);
    };
    // Capture phase so it also fires for inner scroll containers (e.g. the
    // dashboard's <main overflow-y-auto>), not just the window.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.aria}
      className={cn(
        "group fixed bottom-5 right-5 z-50 flex items-center gap-2 no-underline transition-all duration-300 ease-out",
        hidden
          ? "pointer-events-none translate-y-20 opacity-0"
          : "translate-y-0 opacity-100",
      )}
    >
      {/* Label expands on hover (desktop) */}
      <span className="pointer-events-none hidden max-w-0 items-center overflow-hidden whitespace-nowrap rounded-full border border-border bg-card px-0 py-1.5 text-xs font-medium text-text-primary opacity-0 shadow-lg shadow-black/20 transition-all duration-300 group-hover:max-w-[160px] group-hover:px-3.5 group-hover:opacity-100 sm:inline-flex">
        {t.label}
      </span>

      {/* Button */}
      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
        style={{
          background: "linear-gradient(135deg, #2AABEE, #229ED9)",
          boxShadow: "0 6px 18px -5px rgba(34,158,217,0.5)",
        }}
      >
        <span
          className="absolute inset-0 rounded-full bg-[#229ED9] opacity-30 animate-ping"
          aria-hidden="true"
        />
        <Send className="relative -ml-0.5 h-5 w-5 rotate-[18deg]" aria-hidden="true" />
      </span>
    </a>
  );
}
