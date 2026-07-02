"use client";

/**
 * Reusable pixel-settings editor. Used by the admin (Dralvo scope, raw code
 * allowed) and the partner portal (ids only). Self-contained — no admin/partner
 * cross-imports — so either side can mount it.
 *
 * `endpoint` serves both GET (load) and POST (save). `payloadExtra` is merged
 * into the POST body (e.g. { scope: "dralvo" }). Ids are re-validated server-side.
 */
import { useCallback, useEffect, useState } from "react";
import { Loader2, Check, AlertTriangle, Save, ShieldAlert } from "lucide-react";

type Fields = {
  ga4Id: string;
  googleAdsId: string;
  googleAdsPurchaseLabel: string;
  metaPixelId: string;
  tiktokPixelId: string;
};

const EMPTY: Fields = {
  ga4Id: "",
  googleAdsId: "",
  googleAdsPurchaseLabel: "",
  metaPixelId: "",
  tiktokPixelId: "",
};

const ID_FIELDS: { key: keyof Fields; label: string; placeholder: string }[] = [
  { key: "ga4Id", label: "Google Analytics 4", placeholder: "G-XXXXXXXXXX" },
  { key: "googleAdsId", label: "Google Ads ID", placeholder: "AW-XXXXXXXXX" },
  { key: "googleAdsPurchaseLabel", label: "Google Ads — nhãn conversion Purchase", placeholder: "AW-XXXXXXXXX/abcDEF…" },
  { key: "metaPixelId", label: "Meta (Facebook) Pixel", placeholder: "1234567890" },
  { key: "tiktokPixelId", label: "TikTok Pixel", placeholder: "CABC123…" },
];

export function PixelSettingsForm({
  endpoint,
  allowRawCode = false,
  payloadExtra,
  title = "Cấu hình Pixel",
  description,
}: {
  endpoint: string;
  allowRawCode?: boolean;
  payloadExtra?: Record<string, unknown>;
  title?: string;
  description?: string;
}) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [customHead, setCustomHead] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(endpoint)
      .then(async (r) => {
        if (!r.ok) throw new Error("Không tải được cấu hình.");
        return r.json();
      })
      .then((data) => {
        const s = data.settings;
        if (s) {
          setFields({
            ga4Id: s.ga4_id ?? "",
            googleAdsId: s.google_ads_id ?? "",
            googleAdsPurchaseLabel: s.google_ads_purchase_label ?? "",
            metaPixelId: s.meta_pixel_id ?? "",
            tiktokPixelId: s.tiktok_pixel_id ?? "",
          });
          setCustomHead(s.custom_head ?? "");
          setCustomBody(s.custom_body ?? "");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => load(), [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, unknown> = { ...payloadExtra, ...fields };
      if (allowRawCode) {
        body.customHead = customHead;
        body.customBody = customBody;
      }
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Không lưu được cấu hình.");
      setSaved(true);
      // Reload to reflect server-side normalization (invalid ids dropped).
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-[12px] text-text-muted mt-0.5">{description}</p>}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse" aria-busy aria-label="Đang tải cấu hình">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: ID_FIELDS.length }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-32 rounded bg-deep" />
                <div className="h-8 w-full rounded-md bg-deep" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-text-muted mb-2">ID pixel</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ID_FIELDS.map((f) => (
                <label key={f.key} className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">{f.label}</span>
                  <input
                    type="text"
                    value={fields[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="rounded-md border border-border bg-deep px-2.5 py-1.5 text-[13px] font-mono text-text-primary placeholder:text-text-muted/60 transition-colors hover:border-text-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  />
                </label>
              ))}
            </div>
          </div>

          {allowRawCode && (
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Mã tracking thô</p>
              <div className="flex items-start gap-2 rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-[12px] text-gold/90">
                <ShieldAlert size={15} className="shrink-0 mt-px" />
                <p>
                  Dán nguyên mã tracking (GTM, Hotjar, Clarity… — gồm cả thẻ <code className="font-mono">&lt;script&gt;</code>/<code className="font-mono">&lt;noscript&gt;</code>). Code chạy trên dralvo.com cho mọi khách — chỉ dán mã bạn tin tưởng.
                </p>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Head — chèn vào &lt;head&gt; (vd: GTM &lt;script&gt;)</span>
                <textarea
                  value={customHead}
                  onChange={(e) => setCustomHead(e.target.value)}
                  rows={4}
                  spellCheck={false}
                  className="rounded-md border border-border bg-deep px-2.5 py-1.5 text-[12px] font-mono text-text-primary leading-relaxed transition-colors hover:border-text-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Body — chèn đầu &lt;body&gt; (vd: GTM &lt;noscript&gt;)</span>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  className="rounded-md border border-border bg-deep px-2.5 py-1.5 text-[12px] font-mono text-text-primary leading-relaxed transition-colors hover:border-text-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red/30 bg-red/5 px-3 py-2 text-[12px] text-red">
              <AlertTriangle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 border-t border-border mt-1">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-gold text-[#060609] text-[13px] font-semibold px-4 py-2 mt-3 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" />Đang lưu</> : <><Save size={14} />Lưu cấu hình</>}
            </button>
            {saved && !saving && (
              <span className="inline-flex items-center gap-1 text-[12px] text-green mt-3"><Check size={14} />Đã lưu</span>
            )}
            <span className="text-[11px] text-text-muted ml-auto mt-3">ID sai định dạng sẽ bị bỏ qua khi lưu.</span>
          </div>
        </div>
      )}
    </div>
  );
}
