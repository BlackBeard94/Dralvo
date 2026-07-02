"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Crown,
  Coins,
  CreditCard,
  DollarSign,
  Handshake,
  UserPlus,
  KeyRound,
  TrendingUp,
  PieChart,
  Loader2,
} from "lucide-react";
import { Loading, ErrorState, Empty, planLabel } from "@/components/admin/admin-ui";

interface RecentUser {
  id: string;
  email: string | null;
  created_at: string;
}

interface RecentLicense {
  user_id: string;
  email: string | null;
  product: string;
  plan: string;
  created_at: string;
}

interface OverviewStats {
  role: string;
  perms: { users: boolean; finance: boolean; affiliate: boolean };
  totalUsers: number | null;
  unlimitedActive: number | null;
  tigoldCount: number | null;
  stripeActiveSubs: number | null;
  totalStripeRevenue: number | null;
  pendingCommissions: number | null;
  range: { from: string; to: string };
  newUsersInRange: number | null;
  newLicensesInRange: number | null;
  newSubsInRange: number | null;
  revenueInRange: number | null;
  licensesByProduct: { goldmaster: number; goldscalp: number; tigold: number } | null;
  planDistribution: { free: number; vip: number; tigold: number } | null;
  recentUsers: RecentUser[];
  recentLicenses: RecentLicense[];
  products: string[];
}

type Preset = "7" | "30" | "90" | "all" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "7", label: "7 ngày" },
  { id: "30", label: "30 ngày" },
  { id: "90", label: "90 ngày" },
  { id: "all", label: "Tất cả" },
  { id: "custom", label: "Tùy chỉnh" },
];

type Range = { from?: string; to?: string };

// react-hooks/purity: never call Date.now()/new Date() during render. Compute
// range bounds only here (called from event handlers / load()).
function rangeForPreset(p: Preset): Range {
  if (p === "all" || p === "custom") return {};
  const days = parseInt(p, 10);
  const now = Date.now();
  return {
    from: new Date(now - days * 86400000).toISOString().slice(0, 10),
    to: new Date(now).toISOString().slice(0, 10),
  };
}

/** Default custom window: last 30 days (used to seed the date inputs). */
function defaultCustomRange(): Required<Range> {
  const now = Date.now();
  return {
    from: new Date(now - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date(now).toISOString().slice(0, 10),
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const PRODUCT_LABEL: Record<string, string> = {
  goldmaster: "GoldMaster",
  goldscalp: "GoldScalp",
  tigold: "TiGold",
};

export function OverviewSection() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>("30");
  // Custom range inputs (YYYY-MM-DD). Empty until the user picks "Tùy chỉnh".
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const load = useCallback((range: Range) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    const qs = params.toString();
    fetch(`/api/admin/overview${qs ? `?${qs}` : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Bạn không có quyền xem mục này." : "Không tải được số liệu.");
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Presets auto-load on change; custom waits for the "Áp dụng" button so it
  // doesn't fire on every keystroke / a half-entered range.
  useEffect(() => {
    if (preset !== "custom") load(rangeForPreset(preset));
  }, [load, preset]);

  const pickCustom = () => {
    // Seed the inputs with a sensible window the first time it's opened.
    if (!customFrom || !customTo) {
      const d = defaultCustomRange();
      setCustomFrom((v) => v || d.from);
      setCustomTo((v) => v || d.to);
    }
    setPreset("custom");
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    load({ from: customFrom, to: customTo });
  };

  if (loading && !stats) return <Loading />;
  if (error && !stats) return <ErrorState text={error} onRetry={() => load(rangeForPreset(preset))} />;
  if (!stats) return null;

  type Kpi = { label: string; value: number | string; Icon: typeof Users; tone: string };
  const kpis: Kpi[] = [];
  if (stats.totalUsers !== null) kpis.push({ label: "Tổng users", value: stats.totalUsers, Icon: Users, tone: "text-gold" });
  if (stats.unlimitedActive !== null) kpis.push({ label: "VIP đang active", value: stats.unlimitedActive, Icon: Crown, tone: "text-gold" });
  if (stats.tigoldCount !== null) kpis.push({ label: "TiGold", value: stats.tigoldCount, Icon: Coins, tone: "text-gold" });
  if (stats.stripeActiveSubs !== null) kpis.push({ label: "Stripe subs active", value: stats.stripeActiveSubs, Icon: CreditCard, tone: "text-green" });
  if (stats.totalStripeRevenue !== null) kpis.push({ label: "Doanh thu Stripe", value: `$${stats.totalStripeRevenue}`, Icon: DollarSign, tone: "text-green" });
  if (stats.pendingCommissions !== null) kpis.push({ label: "Affiliate chờ duyệt", value: stats.pendingCommissions, Icon: Handshake, tone: "text-gold" });

  const activity: Kpi[] = [];
  if (stats.newUsersInRange !== null) activity.push({ label: "User mới", value: stats.newUsersInRange, Icon: UserPlus, tone: "text-gold" });
  if (stats.newLicensesInRange !== null) activity.push({ label: "License cấp", value: stats.newLicensesInRange, Icon: KeyRound, tone: "text-gold" });
  if (stats.newSubsInRange !== null) activity.push({ label: "Sub mới", value: stats.newSubsInRange, Icon: CreditCard, tone: "text-green" });
  if (stats.revenueInRange !== null) activity.push({ label: "Doanh thu (range)", value: `$${stats.revenueInRange}`, Icon: TrendingUp, tone: "text-green" });

  const byProduct = stats.licensesByProduct
    ? stats.products.map((p) => ({ product: p, label: PRODUCT_LABEL[p] ?? p, count: (stats.licensesByProduct as Record<string, number>)[p] ?? 0 }))
    : [];
  const maxProduct = Math.max(1, ...byProduct.map((b) => b.count));

  // TiGold is a free tier → fold it into Free. Distribution is just Free vs VIP.
  const dist = stats.planDistribution;
  const freeCount = dist ? dist.free + dist.tigold : 0;
  const distTotal = Math.max(1, freeCount + (dist?.vip ?? 0));
  const distSegments = [
    { label: "Free", value: freeCount, color: "bg-text-muted", text: "text-text-secondary" },
    { label: "VIP", value: dist?.vip ?? 0, color: "bg-gold", text: "text-gold" },
  ];

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Tổng quan</h2>
          <p className="text-[12px] text-text-muted flex items-center gap-1.5">
            Hoạt động {preset === "all" ? "toàn thời gian" : `${fmtDate(stats.range.from)} → ${fmtDate(stats.range.to)}`}
            {loading && <Loader2 size={12} className="animate-spin text-gold" />}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => (p.id === "custom" ? pickCustom() : setPreset(p.id))}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer border-none transition-colors ${
                  preset === p.id ? "bg-gold text-[#060609]" : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range — appears when "Tùy chỉnh" is selected */}
          {preset === "custom" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1">
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-border bg-deep px-2 py-1 text-[12px] text-text-primary"
                aria-label="Từ ngày"
              />
              <span className="text-text-muted text-[12px]">→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-border bg-deep px-2 py-1 text-[12px] text-text-primary"
                aria-label="Đến ngày"
              />
              <button
                onClick={applyCustom}
                disabled={loading || !customFrom || !customTo}
                className="rounded-md bg-gold text-[#060609] text-[12px] font-semibold px-3 py-1 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {loading ? <><Loader2 size={12} className="animate-spin" />Đang tải</> : "Áp dụng"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content dims while a new range is loading — clear refresh feedback. */}
      <div className={`space-y-5 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : ""}`} aria-busy={loading}>
      {/* KPI cards (all-time) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${c.tone === "text-green" ? "bg-green/10" : "bg-gold/10"} ${c.tone}`}>
              <c.Icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.06em] uppercase text-text-muted truncate">{c.label}</p>
              <p className="text-xl font-semibold font-mono text-text-primary">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity in range */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {activity.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${c.tone === "text-green" ? "bg-green/10" : "bg-gold/10"} ${c.tone}`}>
              <c.Icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.06em] uppercase text-text-muted truncate">{c.label}</p>
              <p className="text-lg font-semibold font-mono text-text-primary">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detail grid — user data, only for users.view */}
      {stats.perms.users && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* License theo EA */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={15} className="text-gold" />
            <h3 className="text-sm font-semibold text-text-primary">License theo EA</h3>
            <span className="text-[11px] text-text-muted ml-auto">đang active</span>
          </div>
          <div className="space-y-3">
            {byProduct.map((b) => (
              <div key={b.product}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-text-secondary">{b.label}</span>
                  <span className="text-[12px] font-mono font-semibold text-text-primary">{b.count}</span>
                </div>
                <div className="h-2 rounded-full bg-deep overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.round((b.count / maxProduct) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phân bổ gói */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={15} className="text-gold" />
            <h3 className="text-sm font-semibold text-text-primary">Phân bổ gói</h3>
            <span className="text-[11px] text-text-muted ml-auto">Free / VIP</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {distSegments.map((s) => (
              <div
                key={s.label}
                className={s.color}
                style={{ width: `${(s.value / distTotal) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {distSegments.map((s) => (
              <div key={s.label}>
                <p className="text-[11px] tracking-[0.06em] uppercase text-text-muted mb-0.5">{s.label}</p>
                <p className={`text-lg font-semibold font-mono ${s.text}`}>{s.value}</p>
                <p className="text-[11px] text-text-muted">{Math.round((s.value / distTotal) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Người dùng mới gần đây */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={15} className="text-gold" />
            <h3 className="text-sm font-semibold text-text-primary">Người dùng mới gần đây</h3>
          </div>
          {stats.recentUsers.length === 0 ? (
            <Empty text="Không có user mới trong khoảng này." />
          ) : (
            <div className="divide-y divide-border">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-[12px] text-text-secondary truncate">{u.email ?? u.id.slice(0, 8) + "…"}</span>
                  <span className="text-[11px] text-text-muted font-mono shrink-0">{fmtDate(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* License cấp gần đây */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={15} className="text-gold" />
            <h3 className="text-sm font-semibold text-text-primary">License cấp gần đây</h3>
          </div>
          {stats.recentLicenses.length === 0 ? (
            <Empty text="Chưa có license nào." />
          ) : (
            <div className="divide-y divide-border">
              {stats.recentLicenses.map((l, i) => (
                <div key={`${l.user_id}-${l.product}-${i}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-[12px] text-text-secondary truncate flex-1">{l.email ?? l.user_id.slice(0, 8) + "…"}</span>
                  <span className="text-[11px] font-medium text-text-primary shrink-0">{PRODUCT_LABEL[l.product] ?? l.product}</span>
                  <span className={`text-[11px] font-medium shrink-0 ${l.plan === "unlimited" ? "text-green" : "text-gold"}`}>{planLabel(l.plan)}</span>
                  <span className="text-[11px] text-text-muted font-mono shrink-0">{fmtDate(l.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
      </div>
    </div>
  );
}
