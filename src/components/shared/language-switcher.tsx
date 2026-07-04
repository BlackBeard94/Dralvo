"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import {
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

function Flag({ locale, size = 18 }: { locale: SupportedLocale; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${LOCALE_FLAGS[locale]}.png`}
      alt=""
      className="rounded-[2px] object-cover shrink-0"
      style={{ width: size, height: Math.round((size * 3) / 4) }}
    />
  );
}

export function LanguageSwitcher({
  className,
  align = "right",
}: {
  className?: string;
  /** Which edge the dropdown anchors to. Use "left" where the button sits near
   *  the left edge (e.g. the mobile menu) so the menu grows into view instead
   *  of off-screen. */
  align?: "left" | "right";
}) {
  const { locale, setLocale, mounted } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted) {
    return <div className={cn("theme-toggle opacity-0", className)} aria-hidden="true" />;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        className="theme-toggle gap-1 px-1.5 text-[12px] font-semibold"
        style={{ width: "auto", minWidth: 0 }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language. Current: ${LOCALE_LABELS[locale]}`}
        title={LOCALE_LABELS[locale]}
      >
        <Flag locale={locale} size={18} />
        <span>{LOCALE_SHORT_LABELS[locale]}</span>
        <ChevronDown size={13} aria-hidden="true" className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute mt-2 w-48 max-h-[70vh] overflow-auto rounded-lg border border-border bg-card p-1 z-[60]",
            align === "left" ? "left-0" : "right-0",
          )}
          style={{ boxShadow: "0 16px 40px -12px rgba(0,0,0,0.5)" }}
        >
          {SUPPORTED_LOCALES.map((loc) => {
            const active = loc === locale;
            return (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLocale(loc);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-left transition-colors cursor-pointer border-none bg-transparent",
                    active ? "text-gold-bright" : "text-text-secondary hover:bg-gold/5 hover:text-text-primary",
                  )}
                >
                  <Flag locale={loc} size={20} />
                  <span className="flex-1">{LOCALE_LABELS[loc]}</span>
                  {active && <Check size={14} className="text-gold-bright shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
