export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="rounded-2xl border border-border bg-surface/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="h-3 w-28 rounded-full bg-gold/20" />
            <div className="mt-3 h-8 w-64 rounded-xl bg-card" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-card" />
        </div>
        <div className="h-[360px] rounded-xl border border-border bg-card/80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-64 rounded-2xl border border-border bg-surface/60"
          />
        ))}
      </div>
    </div>
  );
}
