"use client";

/**
 * UTM ad-link builder for the admin panel. Generates campaign tracking links
 * (with optional partner ?p=CODE), saves them to a reusable library, and offers
 * one-click copy. Source suggestions are seeded from the pixels actually
 * configured for Dralvo, tying "set up tracking" → "make the matching link".
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, Copy, Check, Trash2, Plus, Loader2, Eye } from "lucide-react";

type SavedLink = {
  id: string;
  label: string | null;
  full_url: string;
  utm_source: string;
  utm_campaign: string | null;
  partner_label: string | null;
  created_at: string;
};

type Partner = { id: string; code: string; name: string | null };

const BASE_PAGES = [
  { path: "/", label: "Trang chủ" },
  { path: "/pricing", label: "Bảng giá" },
  { path: "/tigold", label: "TiGold (free)" },
];
const MEDIUM_SUGGESTIONS = ["cpc", "paid_social", "display", "email", "video", "affiliate"];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function CampaignLinkBuilder({
  endpoint = "/api/admin/campaign-links",
  hintsEndpoint = "/api/admin/tracking-settings?scope=dralvo",
  partners = [],
  fixedPartnerCode,
}: {
  /** Base path for GET list + POST create/delete. */
  endpoint?: string;
  /** GET endpoint returning { settings } for pixel-based source hints. */
  hintsEndpoint?: string;
  /** Admin: partners the link can be tagged to. Omit for partner mode. */
  partners?: Partner[];
  /** Partner mode: their own referral code, always appended as ?p=CODE. */
  fixedPartnerCode?: string;
}) {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewCopied, setPreviewCopied] = useState(false);
  const [sourceHints, setSourceHints] = useState<string[]>([]);

  // form
  const [label, setLabel] = useState("");
  const [basePath, setBasePath] = useState("/");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [partnerId, setPartnerId] = useState("");

  const loadLinks = useCallback(() => {
    setLoading(true);
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Không tải được link."))))
      .then((d) => setLinks(d.links ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => loadLinks(), [loadLinks]);

  // Seed source suggestions from the configured pixels (Dralvo's for admin, the
  // partner's own for partner mode). A 403/empty result just falls back to defaults.
  useEffect(() => {
    fetch(hintsEndpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const s = d?.settings;
        const hints: string[] = [];
        if (s?.meta_pixel_id) hints.push("facebook");
        if (s?.google_ads_id || s?.ga4_id) hints.push("google");
        if (s?.tiktok_pixel_id) hints.push("tiktok");
        setSourceHints(hints);
      })
      .catch(() => {});
  }, [hintsEndpoint]);

  const allSources = useMemo(
    () => [...new Set([...sourceHints, "facebook", "google", "tiktok", "instagram", "youtube", "email", "zalo"])],
    [sourceHints],
  );

  // Live preview of the link the server will build.
  const preview = useMemo(() => {
    const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com").replace(/\/$/, "");
    const clean = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9_.\- ]/g, "").replace(/\s+/g, "_");
    const params = new URLSearchParams();
    if (clean(source)) params.set("utm_source", clean(source));
    if (clean(medium)) params.set("utm_medium", clean(medium));
    if (clean(campaign)) params.set("utm_campaign", clean(campaign));
    if (clean(content)) params.set("utm_content", clean(content));
    // Partner mode → always the partner's own code; admin → the selected partner.
    const code = fixedPartnerCode ?? partners.find((p) => p.id === partnerId)?.code;
    if (code) params.set("p", code);
    const path = basePath.startsWith("/") ? basePath : "/" + basePath;
    const qs = params.toString();
    return `${origin}${path}${qs ? `?${qs}` : ""}`;
  }, [source, medium, campaign, content, partnerId, basePath, partners, fixedPartnerCode]);

  const create = async () => {
    if (!source.trim()) {
      setError("Nhập kênh (utm_source) trước.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          label,
          base_path: basePath,
          utm_source: source,
          utm_medium: medium,
          utm_campaign: campaign,
          utm_content: content,
          // Partner mode forces the code server-side; only admin picks a partner.
          partner_id: fixedPartnerCode ? undefined : partnerId || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Không lưu được link.");
      setLabel("");
      setCampaign("");
      setContent("");
      loadLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async (link: SavedLink) => {
    try {
      await navigator.clipboard.writeText(link.full_url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((c) => (c === link.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setPreviewCopied(true);
      setTimeout(() => setPreviewCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  const remove = async (id: string) => {
    setLinks((ls) => ls.filter((l) => l.id !== id)); // optimistic
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    }).catch(() => loadLinks());
  };

  const inputCls =
    "rounded-md border border-border bg-deep px-2.5 py-1.5 text-[13px] text-text-primary placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Link2 size={15} className="text-gold" />
        <h3 className="text-sm font-semibold text-text-primary">Tạo link quảng cáo (UTM)</h3>
        <span className="text-[11px] text-text-muted ml-auto">gắn pixel xong → tạo link tại đây</span>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Tên gợi nhớ</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="VD: FB - gói VIP T7" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Trang đích</span>
          <select value={basePath} onChange={(e) => setBasePath(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {BASE_PAGES.map((p) => (
              <option key={p.path} value={p.path}>{p.label} ({p.path})</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Kênh — utm_source *</span>
          <input list="src-hints" value={source} onChange={(e) => setSource(e.target.value)} placeholder="facebook" className={inputCls} />
          <datalist id="src-hints">{allSources.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Hình thức — utm_medium</span>
          <input list="med-hints" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="cpc" className={inputCls} />
          <datalist id="med-hints">{MEDIUM_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Chiến dịch — utm_campaign</span>
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="gold_q3" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Nội dung — utm_content</span>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="video_a" className={inputCls} />
        </label>
        {partners.length > 0 && !fixedPartnerCode && (
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Gắn cho Partner (tùy chọn — thêm ?p=CODE)</span>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={`${inputCls} cursor-pointer`}>
              <option value="">— Không —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.code}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Live preview */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Eye size={13} className="text-text-muted" />
          <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Xem trước link</span>
        </div>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 min-w-0 rounded-md border border-border bg-deep px-3 py-2 break-all text-[12px] font-mono text-gold">{preview}</div>
          <button
            onClick={copyPreview}
            className="shrink-0 inline-flex items-center justify-center w-9 rounded-md border border-border bg-deep text-text-muted hover:text-gold hover:border-gold/40 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Copy link xem trước"
            title="Copy link xem trước"
          >
            {previewCopied ? <Check size={15} className="text-green" /> : <Copy size={15} />}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-[12px] text-red">{error}</p>}
      <div className="mt-3">
        <button
          onClick={create}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-gold text-[#060609] text-[13px] font-semibold px-4 py-2 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" />Đang lưu</> : <><Plus size={14} />Tạo & lưu link</>}
        </button>
      </div>

      {/* Saved links */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Link đã tạo</p>
          {!loading && links.length > 0 && (
            <span className="rounded-full bg-deep px-1.5 py-0.5 text-[10px] font-mono text-text-secondary">{links.length}</span>
          )}
        </div>
        {loading ? (
          <div className="space-y-2 animate-pulse" aria-busy aria-label="Đang tải link">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-40 rounded bg-deep" />
                  <div className="h-2.5 w-full max-w-xs rounded bg-deep" />
                </div>
                <div className="h-7 w-7 rounded-md bg-deep" />
                <div className="h-7 w-7 rounded-md bg-deep" />
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <p className="py-6 text-center text-text-muted text-sm">Chưa có link nào. Tạo link đầu tiên ở trên.</p>
        ) : (
          <div className="divide-y divide-border">
            {links.map((l) => (
              <div key={l.id} className="group flex items-center gap-3 py-2 -mx-1 px-1 rounded-md hover:bg-gold/5 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-text-primary truncate">
                    {l.label || l.utm_campaign || l.utm_source}
                    {l.partner_label && <span className="ml-2 text-[11px] text-text-secondary">· {l.partner_label}</span>}
                  </p>
                  <p className="text-[11px] text-text-muted font-mono truncate" title={l.full_url}>{l.full_url}</p>
                </div>
                <span className="text-[11px] text-text-muted font-mono shrink-0">{fmtDate(l.created_at)}</span>
                <button onClick={() => copy(l)} className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-gold hover:bg-gold/10 cursor-pointer border-none bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" aria-label="Copy link" title="Copy">
                  {copiedId === l.id ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                </button>
                <button onClick={() => remove(l.id)} className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-red hover:bg-red/10 cursor-pointer border-none bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red" aria-label="Xóa link" title="Xóa">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
