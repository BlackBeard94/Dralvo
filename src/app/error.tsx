"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-deep px-6 text-text-primary">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/30">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
          Application error
        </p>
        <h1 className="mt-3 font-display text-3xl">
          Dralvo hit a runtime error.
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Reload this view. If it repeats, check the latest deployment logs.
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
          Try again
        </button>
      </div>
    </main>
  );
}
