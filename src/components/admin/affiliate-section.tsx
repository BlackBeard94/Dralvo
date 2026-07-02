"use client";

/**
 * Affiliate admin — settings + affiliates + commissions.
 * Single source of truth (was duplicated between a standalone page and an
 * inline hub tab; both are now folded into this section).
 */
import { useEffect, useState } from "react";
import { AFFILIATE_COPY } from "@/lib/affiliate/copy";
import type { AffiliateSettings, AffiliateWithUser, AffiliateCommission, AffiliatePayoutWithUser } from "@/lib/affiliate/types";
import { parsePayoutMethod, formatPayoutMethod } from "@/lib/affiliate/payout-options";
import { Loading, ErrorState } from "@/components/admin/admin-ui";

export function AffiliateSection({ isSuper = false }: { isSuper?: boolean }) {
  const t = AFFILIATE_COPY.en.admin;
  const [tab, setTab] = useState<"settings" | "affiliates" | "commissions" | "payouts">("settings");

  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateWithUser[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayoutWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [affQuery, setAffQuery] = useState("");
  const [affStatus, setAffStatus] = useState<"all" | "pending" | "active" | "suspended" | "rejected">("all");

  const [rate, setRate] = useState(30);
  const [cookieDays, setCookieDays] = useState(30);
  const [minPayout, setMinPayout] = useState(50);
  const [programActive, setProgramActive] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/affiliate/settings");
      if (r.status === 401 || r.status === 403) { setError("Bạn không có quyền truy cập danh mục này."); setLoading(false); return; }
      const d = await r.json();
      setSettings(d.settings);
      setRate(Math.round(d.settings.commission_rate * 100));
      setCookieDays(d.settings.cookie_days);
      setMinPayout(d.settings.min_payout);
      setProgramActive(d.settings.program_active);
    } catch { setError("Không tải được."); }
    setLoading(false);
  };

  const loadAffiliates = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/affiliate/payout?action=affiliates");
      const d = await r.json();
      setAffiliates(d.affiliates ?? []);
    } catch { setError("Không tải được."); }
    setLoading(false);
  };

  const loadCommissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/affiliate/payout?action=commissions");
      const d = await r.json();
      setCommissions(d.commissions ?? []);
    } catch { setError("Không tải được."); }
    setLoading(false);
  };

  const loadPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/affiliate/payout?action=payouts");
      const d = await r.json();
      setPayouts(d.payouts ?? []);
    } catch { setError("Không tải được."); }
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, []);

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab);
    setError(null);
    setNotice(null);
    if (newTab === "affiliates") loadAffiliates();
    if (newTab === "commissions") loadCommissions();
    if (newTab === "payouts") loadPayouts();
    if (newTab === "settings") loadSettings();
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/affiliate/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commission_rate: rate / 100, cookie_days: cookieDays, min_payout: minPayout, program_active: programActive }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Lưu thất bại."); }
    setSaving(false);
  };

  const actionAffiliate = async (affiliateId: string, action: string) => {
    try {
      await fetch("/api/admin/affiliate/payout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, affiliateId }),
      });
      loadAffiliates();
    } catch { setError("Thao tác thất bại."); }
  };

  const markPaid = async (commissionIds: string[]) => {
    try {
      await fetch("/api/admin/affiliate/payout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", commissionIds }),
      });
      loadCommissions();
      setNotice(t.paidSuccess);
      setTimeout(() => setNotice(null), 2000);
    } catch { setError("Thao tác thất bại."); }
  };

  const actionPayout = async (payoutId: string, action: "pay_payout" | "reject_payout") => {
    try {
      await fetch("/api/admin/affiliate/payout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payoutId }),
      });
      loadPayouts();
      setNotice(t.paidSuccess);
      setTimeout(() => setNotice(null), 2000);
    } catch { setError("Thao tác thất bại."); }
  };

  const payoutStatusLabel = (s: string) => ({
    requested: t.payoutStatusRequested,
    approved: t.payoutStatusApproved,
    paid: t.payoutStatusPaid,
    rejected: t.payoutStatusRejected,
  } as Record<string, string>)[s] ?? s;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1 w-fit max-w-full">
        {((isSuper ? ["settings", "affiliates", "commissions", "payouts"] : ["settings", "affiliates", "commissions"]) as typeof tab[]).map((tb) => (
          <button key={tb} onClick={() => handleTabChange(tb)} className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none ${tab === tb ? "bg-gold text-[#060609]" : "text-text-muted hover:text-text-primary"}`}>
            {t[tb]}
          </button>
        ))}
      </div>

      {notice && <p className="text-[12px] text-green">{notice}</p>}
      {error && <ErrorState text={error} />}

      {loading ? (
        <Loading />
      ) : (
        <>
          {tab === "settings" && settings && (
            <div className="max-w-[480px] space-y-5">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div>
                  <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted block mb-1.5">{t.commissionRate}</label>
                  <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary font-mono" />
                </div>
                <div>
                  <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted block mb-1.5">{t.cookieDays}</label>
                  <input type="number" value={cookieDays} onChange={(e) => setCookieDays(Number(e.target.value))} className="w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary font-mono" />
                </div>
                <div>
                  <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted block mb-1.5">{t.minPayout}</label>
                  <input type="number" value={minPayout} onChange={(e) => setMinPayout(Number(e.target.value))} className="w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary font-mono" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted">{t.programActive}</label>
                  <button onClick={() => setProgramActive(!programActive)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${programActive ? "bg-green" : "bg-border"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${programActive ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
              <button onClick={saveSettings} disabled={saving} className="rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-6 py-2.5 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60">
                {saved ? t.settingsSaved : t.saveSettings}
              </button>
            </div>
          )}

          {tab === "affiliates" && (() => {
            const q = affQuery.trim().toLowerCase();
            const filtered = affiliates.filter((a) => {
              const matchQ = !q || (a.user_email ?? "").toLowerCase().includes(q) || (a.code ?? "").toLowerCase().includes(q);
              const matchS = affStatus === "all" || a.status === affStatus;
              return matchQ && matchS;
            });
            return (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={affQuery}
                  onChange={(e) => setAffQuery(e.target.value)}
                  placeholder="Tìm theo email hoặc code…"
                  className="flex-1 min-w-[200px] rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary outline-none focus:border-gold"
                />
                <select
                  value={affStatus}
                  onChange={(e) => setAffStatus(e.target.value as typeof affStatus)}
                  className="rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary outline-none focus:border-gold cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="suspended">Tạm khóa</option>
                  <option value="rejected">Từ chối</option>
                </select>
                <span className="text-xs text-text-muted whitespace-nowrap">{filtered.length}/{affiliates.length}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                      <th className="text-left font-medium py-3 px-4">Email</th>
                      <th className="text-left font-medium py-3 px-4">Code</th>
                      <th className="text-left font-medium py-3 px-4">Status</th>
                      <th className="text-right font-medium py-3 px-4">Earned</th>
                      <th className="text-right font-medium py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-3 px-4 text-text-primary">{a.user_email ?? "—"}</td>
                      <td className="py-3 px-4 font-mono text-text-secondary">{a.code}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium ${a.status === "active" ? "text-green" : a.status === "suspended" ? "text-red" : "text-gold"}`}>{a.status}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-primary">${(a.total_earned ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {a.status === "pending" && <button onClick={() => actionAffiliate(a.id, "approve_affiliate")} className="text-[11px] text-green hover:underline border-none bg-transparent cursor-pointer">{t.approve}</button>}
                          {a.status === "pending" && <button onClick={() => actionAffiliate(a.id, "reject_affiliate")} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">{t.reject}</button>}
                          {a.status === "active" && <button onClick={() => actionAffiliate(a.id, "suspend_affiliate")} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">{t.suspend}</button>}
                          {(a.status === "suspended" || a.status === "rejected") && <button onClick={() => actionAffiliate(a.id, "activate_affiliate")} className="text-[11px] text-green hover:underline border-none bg-transparent cursor-pointer">Mở khóa</button>}
                          <button
                            onClick={() => { if (confirm(`Xóa affiliate "${a.user_email ?? a.code}"? Toàn bộ hoa hồng & yêu cầu rút sẽ bị xóa. Không thể hoàn tác.`)) actionAffiliate(a.id, "delete_affiliate"); }}
                            className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-text-muted">{affiliates.length === 0 ? "No affiliates yet." : "Không có affiliate khớp bộ lọc."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })()}

          {tab === "commissions" && (
            <div className="space-y-4">
              {commissions.length > 0 && (
                <button onClick={() => markPaid(commissions.filter((c) => c.status === "pending").map((c) => c.id))} className="rounded-md bg-green px-4 py-2 text-[#060609] text-sm font-semibold cursor-pointer border-none hover:scale-[1.02] transition-transform">
                  {t.markPaid} ({commissions.filter((c) => c.status === "pending").length})
                </button>
              )}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                      <th className="text-left font-medium py-3 px-4">Date</th>
                      <th className="text-left font-medium py-3 px-4">Khách</th>
                      <th className="text-left font-medium py-3 px-4">Affiliate</th>
                      <th className="text-right font-medium py-3 px-4">Hoa hồng</th>
                      <th className="text-right font-medium py-3 px-4">Đơn gốc</th>
                      <th className="text-right font-medium py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="py-3 px-4 text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-text-primary max-w-[200px] truncate" title={c.customer_email ?? c.customer_id ?? ""}>{c.customer_email ?? "—"}</td>
                        <td className="py-3 px-4 font-mono text-text-secondary">{c.affiliate_code ?? "—"}</td>
                        <td className="py-3 px-4 text-right font-mono text-green">${c.amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-text-muted">${(c.source_amount ?? 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right"><span className={`text-[11px] font-medium ${c.status === "paid" ? "text-green" : c.status === "pending" ? "text-gold" : "text-text-muted"}`}>{c.status}</span></td>
                      </tr>
                    ))}
                    {commissions.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-text-muted">{t.noCommissions}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "payouts" && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                    <th className="text-left font-medium py-3 px-4">Email</th>
                    <th className="text-left font-medium py-3 px-4">Code</th>
                    <th className="text-right font-medium py-3 px-4">Amount</th>
                    <th className="text-left font-medium py-3 px-4">Nhận tiền</th>
                    <th className="text-left font-medium py-3 px-4">Requested</th>
                    <th className="text-left font-medium py-3 px-4">Status</th>
                    <th className="text-right font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-3 px-4 text-text-primary">{p.user_email ?? "—"}</td>
                      <td className="py-3 px-4 font-mono text-text-secondary">{p.affiliate_code ?? "—"}</td>
                      <td className="py-3 px-4 text-right font-mono text-text-primary">${p.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-[12px] text-text-secondary max-w-[260px] break-all" title={formatPayoutMethod(parsePayoutMethod(p.method))}>
                        {formatPayoutMethod(parsePayoutMethod(p.method))}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{new Date(p.requested_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium ${p.status === "paid" ? "text-green" : p.status === "rejected" ? "text-red" : "text-gold"}`}>
                          {payoutStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(p.status === "requested" || p.status === "approved") && (
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => actionPayout(p.id, "pay_payout")} className="text-[11px] text-green hover:underline border-none bg-transparent cursor-pointer">{t.payoutPay}</button>
                            <button onClick={() => actionPayout(p.id, "reject_payout")} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">{t.payoutReject}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-text-muted">{t.noPayouts}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
