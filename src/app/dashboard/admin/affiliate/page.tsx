"use client";

import { useEffect, useState } from "react";
import { AFFILIATE_COPY } from "@/lib/affiliate/copy";
import type { AffiliateSettings, AffiliateWithUser, AffiliateCommission } from "@/lib/affiliate/types";

export default function AdminAffiliatePage() {
  const t = AFFILIATE_COPY.en.admin;
  const [tab, setTab] = useState<"settings" | "affiliates" | "commissions">("settings");

  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateWithUser[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [rate, setRate] = useState(30);
  const [cookieDays, setCookieDays] = useState(30);
  const [minPayout, setMinPayout] = useState(50);
  const [programActive, setProgramActive] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/affiliate/settings");
      if (r.status === 401) { setError("Unauthorized — add your user ID to AFFILIATE_ADMIN_IDS env var"); setLoading(false); return; }
      const d = await r.json();
      setSettings(d.settings);
      setRate(Math.round(d.settings.commission_rate * 100));
      setCookieDays(d.settings.cookie_days);
      setMinPayout(d.settings.min_payout);
      setProgramActive(d.settings.program_active);
    } catch { setError("Failed to load"); }
    setLoading(false);
  };

  const loadAffiliates = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/affiliate/payout?action=affiliates");
      const d = await r.json();
      setAffiliates(d.affiliates ?? []);
    } catch { setError("Failed to load"); }
    setLoading(false);
  };

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/affiliate/payout?action=commissions");
      const d = await r.json();
      setCommissions(d.commissions ?? []);
    } catch { setError("Failed to load"); }
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, []);

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab);
    setError(null);
    if (newTab === "affiliates") loadAffiliates();
    if (newTab === "commissions") loadCommissions();
    if (newTab === "settings") loadSettings();
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/affiliate/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commission_rate: rate / 100,
          cookie_days: cookieDays,
          min_payout: minPayout,
          program_active: programActive,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Failed to save"); }
    setSaving(false);
  };

  const actionAffiliate = async (affiliateId: string, action: string) => {
    try {
      await fetch("/api/admin/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, affiliateId }),
      });
      loadAffiliates();
    } catch { setError("Action failed"); }
  };

  const markPaid = async (commissionIds: string[]) => {
    try {
      await fetch("/api/admin/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", commissionIds }),
      });
      loadCommissions();
      setError(t.paidSuccess);
      setTimeout(() => setError(null), 2000);
    } catch { setError("Action failed"); }
  };

  if (loading && !settings) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">{t.title}</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
        {(["settings", "affiliates", "commissions"] as const).map((tb) => (
          <button key={tb} onClick={() => handleTabChange(tb)} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none ${tab === tb ? "bg-gold text-[#060609]" : "text-text-muted hover:text-text-primary"}`}>
            {t[tb]}
          </button>
        ))}
      </div>

      {error && <p className="text-[12px] text-green">{error}</p>}

      {/* Settings tab */}
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

      {/* Affiliates tab */}
      {tab === "affiliates" && (
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
              {affiliates.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-3 px-4 text-text-primary">{a.user_email ?? "—"}</td>
                  <td className="py-3 px-4 font-mono text-text-secondary">{a.code}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-medium ${a.status === "active" ? "text-green" : a.status === "suspended" ? "text-red" : "text-gold"}`}>{a.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-text-primary">${(a.total_earned ?? 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status === "pending" && <button onClick={() => actionAffiliate(a.id, "approve_affiliate")} className="text-[11px] text-green hover:underline border-none bg-transparent cursor-pointer">{t.approve}</button>}
                      {a.status === "pending" && <button onClick={() => actionAffiliate(a.id, "reject_affiliate")} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">{t.reject}</button>}
                      {a.status === "active" && <button onClick={() => actionAffiliate(a.id, "suspend_affiliate")} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">{t.suspend}</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {affiliates.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-text-muted">No affiliates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Commissions tab */}
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
                  <th className="text-right font-medium py-3 px-4">Amount</th>
                  <th className="text-right font-medium py-3 px-4">Source</th>
                  <th className="text-right font-medium py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-3 px-4 text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-green">${c.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-text-muted">${(c.source_amount ?? 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right"><span className={`text-[11px] font-medium ${c.status === "paid" ? "text-green" : "text-gold"}`}>{c.status}</span></td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-text-muted">{t.noCommissions}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
