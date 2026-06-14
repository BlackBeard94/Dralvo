"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
        Dashboard error
      </p>
      <h1 className="mt-3 font-display text-3xl text-text-primary">
        Dashboard could not load.
      </h1>
      <p className="mt-3 text-sm leading-6 text-text-muted">
        Retry the request. If it fails again, inspect Supabase, Stripe, or data
        provider logs for the route you opened.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-text-muted">
          Digest: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-deep hover:bg-gold-bright"
      >
        Retry dashboard
      </button>
    </div>
  );
}
