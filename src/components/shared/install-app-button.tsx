"use client";

import { useState } from "react";
import { Download, Share, X } from "lucide-react";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { COMMON_COPY } from "@/lib/common-copy";
import type { SupportedLocale } from "@/lib/i18n";

/**
 * "Install App" CTA. Hides itself when already running standalone, or on
 * browsers that support neither the native install prompt nor iOS's manual
 * Add-to-Home-Screen flow (e.g. desktop Firefox) — there's nothing useful to
 * offer there.
 */
export function InstallAppButton({
  locale,
  className,
  compact,
}: {
  locale: SupportedLocale;
  className?: string;
  /** Icon-only circular variant matching the social-icon row (h-9 w-9), for
   *  narrow footer columns where the labeled button doesn't fit on one line. */
  compact?: boolean;
}) {
  const t = COMMON_COPY[locale].installApp;
  const { canInstall, isStandalone, isIOS, promptInstall } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (isIOS ? setShowIosHelp(true) : promptInstall())}
        aria-label={t.button}
        title={compact ? t.button : undefined}
        className={
          className ??
          (compact
            ? "flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-all hover:scale-105 hover:border-gold/40 hover:text-gold cursor-pointer bg-transparent"
            : "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-gold/40 hover:text-gold cursor-pointer bg-transparent")
        }
      >
        <Download size={14} /> {!compact && t.button}
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">{t.iosTitle}</h3>
              <button
                onClick={() => setShowIosHelp(false)}
                className="cursor-pointer border-none bg-transparent text-text-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <ol className="list-inside list-decimal space-y-2 text-sm text-text-secondary">
              <li>
                {t.iosStep1} <Share size={13} className="inline" />
              </li>
              <li>{t.iosStep2}</li>
              <li>{t.iosStep3}</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
