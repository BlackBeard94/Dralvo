"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { Loading, ErrorState, Empty } from "@/components/admin/admin-ui";

interface Payment {
  id: string;
  date: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
  source: string;
  sourceType: "affiliate" | "partner" | "direct";
}

interface Cashflow {
  grossUSD: number;
  feesUSD: number;
  stripeNetUSD: number;
  partnerUSD: number;
  affiliateUSD: number;
  retainedUSD: number;
  marginPct: number;
  chargeCount: number;
  capped: boolean;
}

const ZERO_CASHFLOW: Cashflow = {
  grossUSD: 0,
  feesUSD: 0,
  stripeNetUSD: 0,
  partnerUSD: 0,
  affiliateUSD: 0,
  retainedUSD: 0,
  marginPct: 0,
  chargeCount: 0,
  capped: false,
};

const fmtUSD = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Preset = "7" | "30" | "90" | "all" | "custom";
const PRESETS: { id: Preset; label: string }[] = [
  { id: "7", label: "7 ngày" },
  { id: "30", label: "30 ngày" },
  { id: "90", label: "90 ngày" },
  { id: "all", label: "Tất cả" },
  { id: "custom", label: "Tùy chỉnh" },
];

function rangeForPreset(p: Preset, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (p === "all") return { from: "2020-01-01", to };
  if (p === "custom") return { from: customFrom, to: customTo };
  const days = parseInt(p, 10);
  return { from: new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10), to };
}

function toCsv(rows: Payment[]): string {
  const head = ["Ngày", "Email", "Nguồn", "Số tiền (USD)", "Trạng thái"];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((p) =>
    [new Date(p.date).toLocaleDateString("vi-VN"), p.email ?? "", p.source, String(p.amount), p.status].map(esc).join(","),
  );
  return [head.map(esc).join(","), ...lines].join("\n");
}

// Default custom-range bounds, computed once at module load (client-side) so the
// component render stays pure (react-hooks/purity: no Date.now()/new Date() in render).
const DEFAULT_CUSTOM_TO = new Date().toISOString().slice(0, 10);
const DEFAULT_CUSTOM_FROM = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export function FinanceSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashflow, setCashflow] = useState<Cashflow>(ZERO_CASHFLOW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>("30");
  const [customFrom, setCustomFrom] = useState(DEFAULT_CUSTOM_FROM);
  const [customTo, setCustomTo] = useState(DEFAULT_CUSTOM_TO);
  const [search, setSearch] = useState("");

  const load = useCallback((p: Preset, cf: string, ct: string) => {
    setLoading(true);
    setError(null);
    const { from, to } = rangeForPreset(p, cf, ct);
    const params = new URLSearchParams({ from, to });
    fetch(`/api/admin/finance?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Bạn không có quyền xem tài chính." : "Không tải được dữ liệu.");
        return r.json();
      })
      .then((d) => {
        setPayments(d.payments ?? []);
        setCashflow(d.cashflow ?? ZERO_CASHFLOW);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Presets auto-load; custom waits for "Áp dụng".
  useEffect(() => {
    if (preset !== "custom") load(preset, customFrom, customTo);
  }, [load, preset, customFrom, customTo]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => (p.email ?? "").toLowerCase().includes(q) || p.source.toLowerCase().includes(q));
  }, [payments, search]);

  const exportCsv = () => {
    const csv = "﻿" + toCsv(visible); // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dralvo-finance-${rangeForPreset(preset, customFrom, customTo).from}_${rangeForPreset(preset, customFrom, customTo).to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const visibleTotal = visible.reduce((s, p) => s + p.amount, 0);

  const cf = cashflow;
  const costSegments = [
    { key: "fees", label: "Phí Stripe", value: cf.feesUSD, color: "bg-red", legend: "bg-red" },
    { key: "partner", label: "Hoa hồng Partner", value: cf.partnerUSD, color: "bg-amber-500", legend: "bg-amber-500" },
    { key: "affiliate", label: "Hoa hồng Affiliate", value: cf.affiliateUSD, color: "bg-orange-400", legend: "bg-orange-400" },
  ];
  const pct = (v: number) => (cf.grossUSD > 0 ? Math.max(0, (v / cf.grossUSD) * 100) : 0);
  const retainedPct = cf.grossUSD > 0 ? Math.max(0, (cf.retainedUSD / cf.grossUSD) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cashflow / ROI panel */}
      <div className="rounded-2xl border border-border bg-surface/60 p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Dòng tiền &amp; Lợi nhuận</h3>
            {loading && <Loader2 size={13} className="animate-spin text-gold" />}
          </div>
          <span className="text-[11px] text-text-muted">{cf.chargeCount} giao dịch Stripe</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] text-text-muted">Doanh thu gộp (Gross)</div>
            <div className="mt-1 font-mono text-base text-text-primary">{fmtUSD(cf.grossUSD)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] text-text-muted">Phí Stripe</div>
            <div className="mt-1 font-mono text-base text-red">−{fmtUSD(cf.feesUSD)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] text-text-muted">Hoa hồng Partner</div>
            <div className="mt-1 font-mono text-base text-red">−{fmtUSD(cf.partnerUSD)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] text-text-muted">Hoa hồng Affiliate</div>
            <div className="mt-1 font-mono text-base text-red">−{fmtUSD(cf.affiliateUSD)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Lợi nhuận giữ lại</span>
              <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                {cf.marginPct.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </span>
            </div>
            <div className="mt-1 font-mono text-base text-green">{fmtUSD(cf.retainedUSD)}</div>
          </div>
        </div>

        {/* Waterfall / stacked bar */}
        {cf.grossUSD > 0 ? (
          <div className="space-y-2">
            <div className="flex h-6 w-full overflow-hidden rounded-lg border border-border bg-deep">
              {costSegments.map((s) => (
                <div key={s.key} className={`${s.color} h-full`} style={{ width: `${pct(s.value)}%` }} title={`${s.label}: ${fmtUSD(s.value)}`} />
              ))}
              <div className="bg-green h-full" style={{ width: `${retainedPct}%` }} title={`Lợi nhuận giữ lại: ${fmtUSD(cf.retainedUSD)}`} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
              {costSegments.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-sm ${s.legend}`} /> {s.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm bg-green" /> Lợi nhuận giữ lại
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-deep/40 py-6 text-center text-[12px] text-text-muted">
            Chưa có giao dịch trong khoảng này
          </div>
        )}

        {cf.capped && (
          <p className="text-[11px] text-amber-500">Lưu ý: dữ liệu Stripe đã đạt giới hạn phân trang — số liệu có thể chưa đầy đủ.</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer border-none transition-colors ${
                  preset === p.id ? "bg-gold text-[#060609]" : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1">
              <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-border bg-deep px-2 py-1 text-[12px] text-text-primary" />
              <span className="text-text-muted text-[12px]">→</span>
              <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-border bg-deep px-2 py-1 text-[12px] text-text-primary" />
              <button onClick={() => load("custom", customFrom, customTo)} disabled={loading} className="rounded-md bg-gold text-[#060609] text-[12px] font-semibold px-3 py-1 cursor-pointer border-none disabled:opacity-50">Áp dụng</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm email / nguồn..."
              className="rounded-md border border-border bg-deep pl-8 pr-3 py-1.5 text-sm text-text-primary w-56 placeholder:text-text-muted"
            />
          </div>
          <button
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="flex gap-4 text-sm items-center">
        <span className="text-text-muted">Doanh thu (lọc): <span className="text-green font-mono">${visibleTotal}</span></span>
        <span className="text-text-muted">Giao dịch: <span className="text-text-primary">{visible.length}</span></span>
        {loading && <Loader2 size={13} className="animate-spin text-gold" />}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={() => load(preset, customFrom, customTo)} />
      ) : visible.length === 0 ? (
        <Empty text="Không có giao dịch nào." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-medium py-3 px-3">Ngày</th>
                <th className="text-left font-medium py-3 px-3">User</th>
                <th className="text-left font-medium py-3 px-3">Nguồn</th>
                <th className="text-right font-medium py-3 px-3">Số tiền</th>
                <th className="text-center font-medium py-3 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => (
                <tr key={p.id || i} className="border-t border-border">
                  <td className="py-2.5 px-3 text-text-secondary">{new Date(p.date).toLocaleDateString("vi-VN")}</td>
                  <td className="py-2.5 px-3 text-text-primary max-w-[200px] truncate" title={p.email ?? ""}>{p.email ?? "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-medium ${p.sourceType === "affiliate" ? "text-gold" : p.sourceType === "partner" ? "text-green" : "text-text-muted"}`}>{p.source}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-green">${p.amount}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[11px] font-medium ${p.status === "active" || p.status === "confirmed" ? "text-green" : "text-text-muted"}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
