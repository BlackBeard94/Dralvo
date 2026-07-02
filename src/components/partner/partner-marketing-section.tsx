"use client";

/**
 * Partner portal — marketing. Mirrors the admin marketing UI (tabs + section
 * headers + funnel tables + skeleton) but scoped to THIS partner only:
 *   • "Hiệu quả"  — KPIs + funnel by channel/campaign (their attributed customers)
 *   • "Tạo link"  — UTM builder, links always carry this partner's ?p=CODE
 *   • "Pixel"     — their own pixel ids (ids only, no raw script)
 * Standalone (no admin imports), matching the rest of the partner portal.
 */
import { useCallback, useEffect, useState } from "react";
import {
  UserPlus,
  Target,
  Percent,
  DollarSign,
  Radio,
  Megaphone,
  Loader2,
  BarChart3,
  Link2,
  Settings2,
} from "lucide-react";

import { PixelSettingsForm } from "@/components/marketing/pixel-settings-form";
import { CampaignLinkBuilder } from "@/components/marketing/campaign-link-builder";

type Bucket = { key: string; leads: number; conversions: number; revenue: number; cvr: number; share?: number };

interface Funnel {
  range: { from: string; to: string };
  totals: { leads: number; conversions: number; cvr: number; revenue: number };
  byChannel: Bucket[];
  byCampaign: Bucket[];
  channels: string[];
  campaigns: string[];
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

function rangeForPreset(p: Preset): Range {
  if (p === "all" || p === "custom") return {};
  const days = parseInt(p, 10);
  const now = Date.now();
  return {
    from: new Date(now - days * 86400000).toISOString().slice(0, 10),
    to: new Date(now).toISOString().slice(0, 10),
  };
}
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

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-text-muted text-sm">{text}</p>;
}

function ColHead({ children, w }: { children: React.ReactNode; w: string }) {
  return <span className={`text-right ${w} text-[11px] uppercase tracking-[0.06em] text-text-muted`}>{children}</span>;
}

function BreakdownTable({ title, icon: Icon, caption, rows, showShare = false }: { title: string; icon: typeof Radio; caption: string; rows: Bucket[]; showShare?: boolean }) {
  const maxLeads = Math.max(1, ...rows.map((r) => r.leads));
  const cols = showShare ? "grid-cols-[1fr_auto_auto_auto_auto]" : "grid-cols-[1fr_auto_auto_auto]";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-gold" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <span className="text-[11px] text-text-muted ml-auto">{caption}</span>
      </div>
      {rows.length === 0 ? (
        <Empty text="Chưa có dữ liệu trong khoảng này." />
      ) : (
        <div className="space-y-3">
          <div className={`grid ${cols} gap-3`}>
            <span className="text-[11px] uppercase tracking-[0.06em] text-text-muted">Nguồn</span>
            <ColHead w="w-12">Lead</ColHead>
            {showShare && <ColHead w="w-14">Tỉ lệ</ColHead>}
            <ColHead w="w-12">Conv</ColHead>
            <ColHead w="w-14">CVR</ColHead>
          </div>
          {rows.map((r) => (
            <div key={r.key} className="group">
              <div className={`grid ${cols} gap-3 items-center mb-1`}>
                <span className="text-[12px] text-text-secondary truncate" title={r.key}>{r.key}</span>
                <span className="text-[12px] font-mono text-text-primary text-right w-12">{r.leads}</span>
                {showShare && <span className="text-[12px] font-mono text-text-secondary text-right w-14">{r.share ?? 0}%</span>}
                <span className="text-[12px] font-mono text-green text-right w-12">{r.conversions}</span>
                <span className="text-[12px] font-mono text-gold text-right w-14">{r.cvr}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-deep overflow-hidden">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out group-hover:bg-gold/80"
                  style={{ width: `${Math.round((r.leads / maxLeads) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc }: { icon: typeof Radio; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-gold/10 text-gold">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="text-[12px] text-text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

type Tab = "performance" | "links" | "pixel";

export function PartnerMarketingSection({ code }: { code: string }) {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [channel, setChannel] = useState("");
  const [campaign, setCampaign] = useState("");
  const [tab, setTab] = useState<Tab>("performance");

  const load = useCallback((range: Range, ch: string, camp: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    if (ch) params.set("channel", ch);
    if (camp) params.set("campaign", camp);
    const qs = params.toString();
    fetch(`/api/partner/marketing${qs ? `?${qs}` : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Không tải được số liệu marketing.");
        return r.json();
      })
      .then(setFunnel)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (preset !== "custom") load(rangeForPreset(preset), channel, campaign);
  }, [load, preset, channel, campaign]);

  const pickCustom = () => {
    if (!customFrom || !customTo) {
      const d = defaultCustomRange();
      setCustomFrom((v) => v || d.from);
      setCustomTo((v) => v || d.to);
    }
    setPreset("custom");
  };
  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    load({ from: customFrom, to: customTo }, channel, campaign);
  };

  if (loading && !funnel) return <MarketingSkeleton />;
  if (error && !funnel) return <div className="rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">{error}</div>;
  if (!funnel) return null;

  const kpis = [
    { label: "Leads", value: funnel.totals.leads, Icon: UserPlus, tone: "text-gold" },
    { label: "Conversions", value: funnel.totals.conversions, Icon: Target, tone: "text-green" },
    { label: "Tỷ lệ chuyển đổi", value: `${funnel.totals.cvr}%`, Icon: Percent, tone: "text-gold" },
    { label: "Doanh thu", value: `$${funnel.totals.revenue}`, Icon: DollarSign, tone: "text-green" },
  ];

  const TABS: { id: Tab; label: string; Icon: typeof Radio }[] = [
    { id: "performance", label: "Hiệu quả", Icon: BarChart3 },
    { id: "links", label: "Tạo link", Icon: Link2 },
    { id: "pixel", label: "Pixel", Icon: Settings2 },
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-base font-semibold text-text-primary">Marketing — Quảng cáo</h1>
        <p className="text-[12px] text-text-muted">Đo hiệu quả quảng cáo của riêng bạn, tạo link UTM và gắn pixel chuyển đổi.</p>
      </div>

      {/* Control row: tabs (left) ⟷ filter (right, performance tab only) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div role="tablist" aria-label="Mục marketing" className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer border-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  active ? "bg-gold text-[#060609]" : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <t.Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "performance" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-text-muted flex items-center gap-1.5 mr-1">
              {preset === "all" ? "Toàn thời gian" : `${fmtDate(funnel.range.from)} → ${fmtDate(funnel.range.to)}`}
              {loading && <Loader2 size={12} className="animate-spin text-gold" />}
            </span>
            {funnel.channels.length > 0 && (
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label="Lọc theo nguồn traffic"
              >
                <option value="">Mọi nguồn traffic</option>
                {funnel.channels.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            {funnel.campaigns.length > 0 && (
              <select
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label="Lọc theo campaign"
              >
                <option value="">Mọi campaign</option>
                {funnel.campaigns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => (p.id === "custom" ? pickCustom() : setPreset(p.id))}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer border-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    preset === p.id ? "bg-gold text-[#060609]" : "bg-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1">
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border border-border bg-deep px-2 py-1 text-[12px] text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Từ ngày"
                />
                <span className="text-text-muted text-[12px]">→</span>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border border-border bg-deep px-2 py-1 text-[12px] text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Đến ngày"
                />
                <button
                  onClick={applyCustom}
                  disabled={loading || !customFrom || !customTo}
                  className="rounded-md bg-gold text-[#060609] text-[12px] font-semibold px-3 py-1 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {loading ? <><Loader2 size={12} className="animate-spin" />Đang tải</> : "Áp dụng"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Hiệu quả ─────────────────────────────────────────────── */}
      {tab === "performance" && (
        <div className={`space-y-5 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : ""}`} aria-busy={loading}>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakdownTable title="Theo nguồn traffic" icon={Radio} caption="lead / tỉ lệ / conv / CVR" rows={funnel.byChannel} showShare />
            <BreakdownTable title="Theo campaign" icon={Megaphone} caption="utm_campaign" rows={funnel.byCampaign} />
          </div>
        </div>
      )}

      {/* ── Tạo link ─────────────────────────────────────────────── */}
      {tab === "links" && (
        <div className="space-y-4">
          <SectionHeader
            icon={Link2}
            title="Tạo link quảng cáo"
            desc="Gắn UTM vào link đích — link luôn kèm mã giới thiệu của bạn để quy chuyển đổi về đúng tài khoản."
          />
          <CampaignLinkBuilder
            endpoint="/api/partner/campaign-links"
            hintsEndpoint="/api/partner/tracking-settings"
            fixedPartnerCode={code}
          />
        </div>
      )}

      {/* ── Pixel (của riêng partner, ID-only) ───────────────────── */}
      {tab === "pixel" && (
        <div className="space-y-4">
          <SectionHeader
            icon={Settings2}
            title="Pixel của bạn"
            desc="Gắn ID pixel để quảng cáo của bạn nhận chuyển đổi từ khách bạn giới thiệu. Chỉ nhập ID — không hỗ trợ mã script."
          />
          <PixelSettingsForm
            endpoint="/api/partner/tracking-settings"
            title="Pixel của bạn"
            description="Chỉ nhập ID pixel (Meta / Google / TikTok…). Không hỗ trợ dán mã script."
          />
        </div>
      )}
    </div>
  );
}

/** First-paint skeleton: header + tab rail + KPI row + two breakdown cards. */
function MarketingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy aria-label="Đang tải số liệu marketing">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-4 w-44 rounded bg-card" />
          <div className="h-3 w-64 rounded bg-card" />
        </div>
        <div className="h-9 w-56 rounded-lg bg-card" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-deep shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-16 rounded bg-deep" />
              <div className="h-4 w-12 rounded bg-deep" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-deep" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-3 w-full rounded bg-deep" />
                <div className="h-1.5 w-full rounded-full bg-deep" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
