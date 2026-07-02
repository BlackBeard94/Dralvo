"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Customer {
  user_id: string;
  email: string | null;
  plan: string | null;
  created_at: string;
  status?: string | null;
}

/** Display label for a license plan (presentation only). */
function planLabel(plan: string | null): string {
  if (!plan) return "—";
  if (plan === "unlimited") return "VIP";
  if (plan === "tigold") return "TiGold";
  return plan;
}

export function CustomersSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/partner/customers")
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Bạn không có quyền truy cập." : "Không tải được dữ liệu.");
        return r.json();
      })
      .then((d) => setCustomers(d.customers ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm py-6">
        <Loader2 size={15} className="animate-spin" />
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
        <AlertTriangle size={16} className="shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={load} className="text-[12px] font-semibold underline cursor-pointer border-none bg-transparent text-red">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
            <th className="text-left font-medium py-3 px-3">Email</th>
            <th className="text-left font-medium py-3 px-3">Gói</th>
            <th className="text-center font-medium py-3 px-3">Trạng thái</th>
            <th className="text-right font-medium py-3 px-3">Ngày mua</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.user_id} className="border-t border-border">
              <td className="py-2.5 px-3 text-text-primary">{c.email ?? "—"}</td>
              <td className="py-2.5 px-3 text-text-secondary">{planLabel(c.plan)}</td>
              <td className="py-2.5 px-3 text-center">
                <span className={`text-[11px] font-medium ${c.status === "active" || c.status === "confirmed" ? "text-green" : "text-text-muted"}`}>
                  {c.status ?? "—"}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan={4} className="py-10 text-center text-text-muted">Chưa có khách hàng nào.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
