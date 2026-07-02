"use client";

/** Shared loading / error / empty primitives for admin sections. */
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Display label for a license plan. DB keeps the raw value (`unlimited`) used
 * by license validation — this is presentation only.
 */
export function planLabel(plan: string): string {
  if (plan === "unlimited") return "VIP";
  if (plan === "tigold") return "TiGold";
  return plan;
}

export function Loading({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-text-muted text-sm py-6">
      <Loader2 size={15} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
      <AlertTriangle size={16} className="shrink-0" />
      <span className="flex-1">{text}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-[12px] font-semibold underline cursor-pointer border-none bg-transparent text-red">
          Thử lại
        </button>
      )}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-text-muted text-sm">{text}</p>;
}
