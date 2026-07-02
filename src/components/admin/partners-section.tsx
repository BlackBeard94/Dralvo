"use client";

/**
 * Partner (reseller) admin — super_admin only.
 * List partners, create/edit rate, toggle status, and expand to a monthly
 * commission reconciliation view. Mirrors the visual language of
 * admins-section.tsx and affiliate-section.tsx.
 */
import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { Loading, ErrorState, Empty } from "@/components/admin/admin-ui";
import type { Partner, PartnerCommission } from "@/lib/partners/types";

interface PartnerRow extends Partner {
  email: string | null;
  customer_count: number;
  pending_total: number;
  paid_total: number;
}

interface CommissionRow extends PartnerCommission {
  customer_email: string | null;
}

interface PeriodGroup {
  period: string;
  rows: CommissionRow[];
  pendingTotal: number;
  paidTotal: number;
  hasPending: boolean;
}

const API = "/api/admin/partners";

export function PartnersSection() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // create form
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("20"); // percent

  // inline rate edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");

  // expanded reconciliation
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [commLoading, setCommLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(API)
      .then(async (r) => {
        if (!r.ok) throw new Error("Không tải được danh sách partner.");
        return r.json();
      })
      .then((d) => setPartners(d.partners ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2200);
  };

  const post = async (payload: Record<string, unknown>) => {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return r.json();
  };

  const create = async () => {
    if (!newEmail) return;
    const rate = Number(newRate) / 100;
    const d = await post({ action: "create", email: newEmail, name: newName || null, commissionRate: rate });
    if (d.success) {
      setNewEmail("");
      setNewName("");
      setNewRate("20");
      setShowForm(false);
      flash("Đã tạo partner.");
      load();
    } else {
      flash(d.error ?? "Lỗi");
    }
  };

  const saveRate = async (id: string) => {
    const rate = Number(editRate) / 100;
    const d = await post({ action: "update_rate", id, commissionRate: rate });
    if (d.success) {
      setEditId(null);
      flash("Đã cập nhật tỷ lệ.");
      load();
    } else {
      flash(d.error ?? "Lỗi");
    }
  };

  const toggleStatus = async (p: PartnerRow) => {
    const next = p.status === "active" ? "suspended" : "active";
    const d = await post({ action: "set_status", id: p.id, status: next });
    if (d.success) load();
    else flash(d.error ?? "Lỗi");
  };

  const loadCommissions = async (partnerId: string) => {
    setCommLoading(true);
    setCommissions([]);
    const d = await post({ action: "commissions", partnerId });
    setCommissions(d.commissions ?? []);
    setCommLoading(false);
  };

  const toggleExpand = (p: PartnerRow) => {
    if (expandedId === p.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(p.id);
    loadCommissions(p.id);
  };

  const markPaid = async (partnerId: string, period: string) => {
    const d = await post({ action: "mark_paid", partnerId, period });
    if (d.success) {
      flash(`Đã đánh dấu đã trả (${d.count} dòng).`);
      loadCommissions(partnerId);
      load();
    } else {
      flash(d.error ?? "Lỗi");
    }
  };

  const groupByPeriod = (rows: CommissionRow[]): PeriodGroup[] => {
    const map = new Map<string, PeriodGroup>();
    for (const c of rows) {
      let g = map.get(c.period);
      if (!g) {
        g = { period: c.period, rows: [], pendingTotal: 0, paidTotal: 0, hasPending: false };
        map.set(c.period, g);
      }
      g.rows.push(c);
      const amt = Number(c.commission_amount) || 0;
      if (c.status === "paid") g.paidTotal += amt;
      else { g.pendingTotal += amt; g.hasPending = true; }
    }
    return [...map.values()].sort((a, b) => (a.period < b.period ? 1 : -1));
  };

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform"
        >
          {showForm ? "Đóng" : "Tạo Partner"}
        </button>
        {msg && <span className="text-[12px] text-green">{msg}</span>}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-[560px]">
          <h3 className="text-sm font-semibold text-text-primary">Tạo Partner mới</h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem]">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email user..."
              className="min-w-0 rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên (tùy chọn)"
              className="min-w-0 rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted"
            />
            <div className="flex items-center gap-1 min-w-0">
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full min-w-0 rounded-md border border-border bg-deep px-2 py-1.5 text-sm text-text-primary font-mono"
              />
              <span className="shrink-0 text-text-muted text-sm">%</span>
            </div>
          </div>
          <button
            onClick={create}
            className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-4 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform"
          >
            Tạo
          </button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={load} />
      ) : partners.length === 0 ? (
        <Empty text="Chưa có partner nào." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-medium py-3 px-4 w-8"></th>
                <th className="text-left font-medium py-3 px-4">Email</th>
                <th className="text-left font-medium py-3 px-4">Code</th>
                <th className="text-right font-medium py-3 px-4">% hoa hồng</th>
                <th className="text-right font-medium py-3 px-4">#Khách</th>
                <th className="text-right font-medium py-3 px-4">Hoa hồng chờ</th>
                <th className="text-right font-medium py-3 px-4">Đã trả</th>
                <th className="text-left font-medium py-3 px-4">Trạng thái</th>
                <th className="text-right font-medium py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const expanded = expandedId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className="border-t border-border">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleExpand(p)}
                          className="text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer"
                          aria-label="Mở đối soát"
                        >
                          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-text-primary">{p.email ?? "—"}</td>
                      <td className="py-3 px-4 font-mono text-text-secondary">{p.code}</td>
                      <td className="py-3 px-4 text-right">
                        {editId === p.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editRate}
                              onChange={(e) => setEditRate(e.target.value)}
                              className="w-16 rounded-md border border-border bg-deep px-2 py-1 text-sm text-text-primary font-mono text-right"
                            />
                            <span className="text-text-muted">%</span>
                            <button onClick={() => saveRate(p.id)} className="text-green border-none bg-transparent cursor-pointer" aria-label="Lưu"><Check size={15} /></button>
                            <button onClick={() => setEditId(null)} className="text-red border-none bg-transparent cursor-pointer" aria-label="Hủy"><X size={15} /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditId(p.id); setEditRate(String(Math.round(p.commission_rate * 100))); }}
                            className="font-mono text-gold hover:underline border-none bg-transparent cursor-pointer"
                          >
                            {Math.round(p.commission_rate * 100)}%
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary">{p.customer_count}</td>
                      <td className="py-3 px-4 text-right font-mono text-gold">${p.pending_total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-green">${p.paid_total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Switch active={p.status === "active"} onChange={() => toggleStatus(p)} />
                          <span className={`text-[11px] font-medium ${p.status === "active" ? "text-green" : "text-red"}`}>
                            {p.status === "active" ? "active" : "suspended"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleExpand(p)}
                          className="text-[11px] text-text-secondary hover:text-text-primary hover:underline border-none bg-transparent cursor-pointer"
                        >
                          Đối soát
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-t border-border bg-deep/30">
                        <td colSpan={9} className="px-4 py-4">
                          {commLoading ? (
                            <Loading />
                          ) : commissions.length === 0 ? (
                            <Empty text="Chưa có hoa hồng cho partner này." />
                          ) : (
                            <div className="space-y-3">
                              {groupByPeriod(commissions).map((g) => (
                                <div key={g.period} className="rounded-xl border border-border bg-card overflow-hidden">
                                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-deep/30">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-text-primary font-mono">{g.period}</span>
                                      <span className="text-[12px] text-gold">Chờ ${g.pendingTotal.toFixed(2)}</span>
                                      <span className="text-[12px] text-green">Đã trả ${g.paidTotal.toFixed(2)}</span>
                                    </div>
                                    {g.hasPending && (
                                      <button
                                        onClick={() => markPaid(p.id, g.period)}
                                        className="rounded-md bg-green px-3 py-1 text-[#060609] text-[11px] font-semibold cursor-pointer border-none hover:scale-[1.02] transition-transform"
                                      >
                                        Đánh dấu đã trả
                                      </button>
                                    )}
                                  </div>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                                        <th className="text-left font-medium py-2 px-4">Khách</th>
                                        <th className="text-left font-medium py-2 px-4">Nguồn</th>
                                        <th className="text-right font-medium py-2 px-4">Doanh số</th>
                                        <th className="text-right font-medium py-2 px-4">Hoa hồng</th>
                                        <th className="text-right font-medium py-2 px-4">Trạng thái</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {g.rows.map((c) => (
                                        <tr key={c.id} className="border-t border-border">
                                          <td className="py-2 px-4 text-text-secondary">{c.customer_email ?? "—"}</td>
                                          <td className="py-2 px-4 text-text-muted">{c.source}</td>
                                          <td className="py-2 px-4 text-right font-mono text-text-secondary">${(Number(c.sale_amount) || 0).toFixed(2)}</td>
                                          <td className="py-2 px-4 text-right font-mono text-text-primary">${(Number(c.commission_amount) || 0).toFixed(2)}</td>
                                          <td className="py-2 px-4 text-right">
                                            <span className={`text-[11px] font-medium ${c.status === "paid" ? "text-green" : "text-gold"}`}>{c.status}</span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Switch({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none shrink-0 ${active ? "bg-green" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
