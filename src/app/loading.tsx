export default function RootLoading() {
  return (
    <main className="min-h-dvh bg-deep px-6 py-10 text-text-primary">
      <div className="mx-auto flex min-h-[70dvh] max-w-5xl flex-col justify-center gap-6">
        <div className="h-3 w-32 rounded-full bg-gold/20" />
        <div className="space-y-3">
          <div className="h-10 w-full max-w-xl rounded-xl bg-surface" />
          <div className="h-10 w-full max-w-lg rounded-xl bg-surface/70" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl border border-border bg-card/70"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
