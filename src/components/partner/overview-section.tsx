"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, Link2, Loader2 } from "lucide-react";

interface PeriodBreakdown {
  period: string;
  saleTotal: number;
  commissionTotal: number;
  count: number;
  status: "pending" | "paid";
}

interface Aggregates {
  totalEarned: number;
  pendingTotal: number;
  paidTotal: number;
  customerCount: number;
}

function money(n: number): string {
  return `$${(Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: "gold" | "green" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-[0.06em] text-text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold font-mono ${accent === "green" ? "text-green" : accent === "gold" ? "text-gold" : "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}

function ReferralLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard blocked (e.g. insecure context) — select fallback below still lets them copy manually.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Link2 size={15} className="text-gold" />
        <h2 className="text-sm font-semibold text-text-primary">Link giới thiệu của bạn</h2>
      </div>
      <p className="mb-3 text-[11px] text-text-muted">
        Chia sẻ link này để giới thiệu khách. Mọi người đăng ký qua link đều được ghi nhận cho bạn (cookie 60 ngày).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-lg border border-border bg-deep px-3 py-2 font-mono text-[13px] text-text-primary outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={copy}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            copied ? "bg-green text-[#060609]" : "bg-gold text-[#060609] hover:opacity-90"
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Đã copy" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

export function OverviewSection({ referralLink }: { referralLink?: string | null }) {
  const [aggregates, setAggregates] = useState<Aggregates>({ totalEarned: 0, pendingTotal: 0, paidTotal: 0, customerCount: 0 });
  const [byPeriod, setByPeriod] = useState<PeriodBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/partner/commissions")
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Bạn không có quyền truy cập." : "Không tải được dữ liệu.");
        return r.json();
      })
      .then((d) => {
        setAggregates(d.aggregates ?? { totalEarned: 0, pendingTotal: 0, paidTotal: 0, customerCount: 0 });
        setByPeriod(d.byPeriod ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {referralLink && <ReferralLinkCard link={referralLink} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Tổng hoa hồng" value={money(aggregates.totalEarned)} accent="gold" />
        <KpiCard label="Đang chờ đối soát" value={money(aggregates.pendingTotal)} />
        <KpiCard label="Đã nhận" value={money(aggregates.paidTotal)} accent="green" />
        <KpiCard label="Số khách" value={String(aggregates.customerCount)} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-2">Hoa hồng theo tháng</h2>
        <p className="text-[11px] text-text-muted mb-3">Tỷ lệ hoa hồng được chốt tại thời điểm phát sinh giao dịch.</p>

        {loading ? (
          <div className="flex items-center gap-2 text-text-muted text-sm py-6">
            <Loader2 size={15} className="animate-spin" />
            Đang tải...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={load} className="text-[12px] font-semibold underline cursor-pointer border-none bg-transparent text-red">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                  <th className="text-left font-medium py-3 px-3">Kỳ</th>
                  <th className="text-right font-medium py-3 px-3">Doanh số</th>
                  <th className="text-right font-medium py-3 px-3">Hoa hồng</th>
                  <th className="text-center font-medium py-3 px-3">Số GD</th>
                  <th className="text-center font-medium py-3 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {byPeriod.map((p) => (
                  <tr key={p.period} className="border-t border-border">
                    <td className="py-2.5 px-3 font-mono text-text-secondary">{p.period}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{money(p.saleTotal)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gold">{money(p.commissionTotal)}</td>
                    <td className="py-2.5 px-3 text-center text-text-secondary">{p.count}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-medium ${p.status === "paid" ? "text-green" : "text-text-muted"}`}>
                        {p.status === "paid" ? "Đã nhận" : "Chờ đối soát"}
                      </span>
                    </td>
                  </tr>
                ))}
                {byPeriod.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-text-muted">Chưa có hoa hồng nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
