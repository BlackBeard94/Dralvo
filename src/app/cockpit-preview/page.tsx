"use client";

/*
 * Dralvo Dashboard — "Gold Cockpit" UI PREVIEW (mock data, no backend).
 * For design review only. Once approved, wire to /api/xauusd, /api/cftc-status,
 * /api/signal/current, license + heartbeat. See docs/DASHBOARD_PLAN.md.
 */
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Bot, Radio, TrendingUp, FlaskConical, Calculator,
  Newspaper, GraduationCap, CreditCard, Settings, ArrowUpRight, ArrowDownRight,
  Check, Lock, ShieldCheck, Circle, ChevronRight, Bell,
} from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb } from "@/components/shared/decor";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { cn } from "@/lib/utils";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', serif";

/* -------------------------------------------------------------------------- */
/*  Mock data (replace with real APIs when backend is built)                  */
/* -------------------------------------------------------------------------- */
const USER = { name: "Nguyễn Văn A", plan: "Elite" };

const KPIS = [
  { label: "Tổng equity", value: "$25,180", sub: "2 tài khoản MT5", tone: "good" as const },
  { label: "Lãi tháng", value: "+$2,140", sub: "tháng 6", tone: "good" as const },
  { label: "Vị thế mở", value: "2", sub: "GoldMaster + Scalp" },
  { label: "EA online", value: "2 / 2", sub: "đang chạy" },
];

const PRICE = { last: "2,648.30", change: "+11.20", pct: "+0.42%", up: true };
const PRICE_PATH = [18, 22, 19, 26, 24, 31, 28, 35, 40, 36, 44, 52, 48, 58, 55, 63, 70, 66, 74, 82, 78, 88, 84, 92];

const CFTC = { state: "BULLISH", mmNet: "142,500", change: "+8,200", pct: 0.72, updated: "T6 13/06" };

const SIGNAL = {
  state: "LONG" as const,
  entry: "2,648.3", sl: "2,610.1", tp: "2,725.4", generated: "08:00 GMT",
  drivers: [
    { k: "CFTC Managed Money", v: "142,500 > 100,000", ok: true },
    { k: "Xu hướng (EMA50 > EMA200)", v: "đang tăng", ok: true },
    { k: "Pullback từ đỉnh 10 ngày", v: "-1.25% ≤ -1.0%", ok: true },
  ],
};

const ROBOTS = [
  { name: "GoldMaster", tf: "D1", online: true, equity: "$12,840", account: "#50123456", license: "đến 15/12/2026", seen: "18 giây trước", accent: "gold" as const, locked: false },
  { name: "Gold Scalp", tf: "M5", online: true, equity: "$12,340", account: "#50777012", license: "đến 15/12/2026", seen: "34 giây trước", accent: "steel" as const, locked: false },
];

const SIGNAL_FEED = [
  { date: "12/06", dir: "LONG", entry: "2,615.0", result: "+3.0R", win: true },
  { date: "02/06", dir: "LONG", entry: "2,580.4", result: "-1.0R", win: false },
  { date: "26/05", dir: "LONG", entry: "2,544.2", result: "+3.0R", win: true },
  { date: "19/05", dir: "LONG", entry: "2,512.8", result: "+1.8R", win: true },
  { date: "08/05", dir: "LONG", entry: "2,478.6", result: "-1.0R", win: false },
];

const NEWS = [
  { t: "Fed giữ nguyên lãi suất, vàng bật tăng", src: "Reuters", time: "2 giờ" },
  { t: "CPI Mỹ thấp hơn dự báo — USD suy yếu", src: "Investing", time: "5 giờ" },
  { t: "CFTC: quỹ lớn tăng mạnh vị thế mua vàng", src: "CFTC COT", time: "1 ngày" },
  { t: "Căng thẳng địa chính trị hỗ trợ giá vàng", src: "Bloomberg", time: "1 ngày" },
];

const CALENDAR = [
  { e: "FOMC — Quyết định lãi suất", d: "18/06 · 01:00", impact: "high" as const },
  { e: "NFP — Bảng lương phi nông nghiệp", d: "05/07 · 19:30", impact: "high" as const },
  { e: "CPI Mỹ", d: "11/07 · 19:30", impact: "high" as const },
  { e: "Bài phát biểu Chủ tịch Fed", d: "20/06 · 21:00", impact: "med" as const },
];

const NAV = [
  { icon: LayoutDashboard, label: "Tổng quan", active: true },
  { icon: Bot, label: "Robot của tôi" },
  { icon: Radio, label: "Tín hiệu" },
  { icon: TrendingUp, label: "Hiệu suất" },
  { icon: FlaskConical, label: "Backtest Lab" },
  { icon: Calculator, label: "Công cụ" },
  { icon: Newspaper, label: "Tin tức vàng" },
  { icon: GraduationCap, label: "Học viện" },
  { icon: CreditCard, label: "Thanh toán" },
  { icon: Settings, label: "Cài đặt" },
];

/* -------------------------------------------------------------------------- */
/*  Small parts                                                               */
/* -------------------------------------------------------------------------- */
function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={cn("rounded-xl border border-border bg-card", className)}>{children}</div>;
}
function CardHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
      <span className="text-[11px] tracking-[0.12em] uppercase font-semibold text-text-muted">{title}</span>
      {right}
    </div>
  );
}

function MiniArea() {
  const W = 320, H = 96, P = 4;
  const max = PRICE_PATH.length - 1;
  const pts = PRICE_PATH.map((y, i) => [P + (i / max) * (W - 2 * P), H - P - (y / 100) * (H - 2 * P)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W - P} ${H - P} L${P} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(70,196,106,0.30)" />
          <stop offset="100%" stopColor="rgba(70,196,106,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#pc)" />
      <path d={line} fill="none" stroke="var(--green)" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function DashboardPreview() {
  const [active, setActive] = useState("Tổng quan");

  return (
    <div className="min-h-screen bg-deep text-text-primary antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface/60 min-h-screen sticky top-0">
          <div className="h-16 flex items-center px-5 border-b border-border"><BrandLink /></div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV.map((item) => {
              const on = item.label === active;
              return (
                <button key={item.label} onClick={() => setActive(item.label)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-colors border-none cursor-pointer text-left",
                    on ? "bg-gold/10 text-gold-bright" : "bg-transparent text-text-secondary hover:text-text-primary hover:bg-card")}>
                  <item.icon size={17} className={on ? "text-gold" : "text-text-muted"} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-3">
            <div className="rounded-lg border border-gold/25 p-4" style={{ background: "linear-gradient(168deg, rgba(212,168,67,0.08), var(--bg-card) 70%)" }}>
              <div className="text-xs font-semibold text-gold-bright mb-1">Gói Elite đang hoạt động</div>
              <p className="text-[11px] text-text-muted leading-relaxed mb-3">2 robot + đa tài khoản + hỗ trợ ưu tiên 1-1.</p>
              <button className="w-full py-2 rounded-md border border-gold/30 text-gold text-xs font-semibold bg-transparent cursor-pointer">Liên hệ hỗ trợ ưu tiên</button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <GlowOrb className="w-[700px] h-[500px] -top-60 right-0 opacity-30" />

          {/* Topbar */}
          <header className="h-16 sticky top-0 z-30 bg-deep/85 backdrop-blur-xl border-b border-border flex items-center justify-between px-5 sm:px-8">
            <div>
              <h1 className="text-lg font-semibold leading-none">Tổng quan</h1>
              <p className="text-[11px] text-text-muted mt-1">Buồng lái giao dịch vàng của bạn</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="relative w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-muted hover:text-gold transition-colors cursor-pointer">
                <Bell size={16} /><span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold-bright" />
              </button>
              <ThemeToggle />
              <LanguageSwitcher />
              <div className="flex items-center gap-2.5 pl-1">
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-medium leading-none">{USER.name}</div>
                  <div className="text-[10px] text-gold-bright mt-1 uppercase tracking-wide">{USER.plan}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-bright text-sm font-semibold">A</div>
              </div>
            </div>
          </header>

          <main className="relative z-10 p-5 sm:p-8 space-y-5">
            <div className="text-[11px] text-text-muted inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
              <Circle size={8} className="text-gold-bright fill-gold-bright" /> Bản xem trước giao diện · dữ liệu mẫu
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {KPIS.map((k) => (
                <Card key={k.label} className="p-4">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-muted">{k.label}</div>
                  <div className={cn("font-mono text-2xl font-bold mt-1.5", k.tone === "good" ? "text-green" : "text-text-primary")}>{k.value}</div>
                  <div className="text-[11px] text-text-muted mt-1">{k.sub}</div>
                </Card>
              ))}
            </div>

            {/* Row 1: price + CFTC */}
            <div className="grid lg:grid-cols-2 gap-5">
              <Card>
                <CardHead title="XAUUSD · Vàng" right={<span className="text-[10px] text-text-muted font-mono">Live · 4H</span>} />
                <div className="p-5">
                  <div className="flex items-end justify-between mb-2">
                    <div className="font-mono text-3xl font-bold">{PRICE.last}</div>
                    <div className={cn("inline-flex items-center gap-1 font-mono text-sm", PRICE.up ? "text-green" : "text-red")}>
                      {PRICE.up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{PRICE.change} ({PRICE.pct})
                    </div>
                  </div>
                  <MiniArea />
                </div>
              </Card>

              <Card>
                <CardHead title="Trạng thái CFTC" right={<span className="text-[10px] text-text-muted font-mono">cập nhật {CFTC.updated}</span>} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold" style={{ color: "var(--green)", background: "rgba(70,196,106,0.1)", border: "1px solid rgba(70,196,106,0.3)" }}>
                      <Circle size={9} className="fill-green text-green" /> {CFTC.state}
                    </span>
                    <span className="text-[12px] text-text-muted">Managed Money đang nghiêng mua</span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="font-mono text-2xl font-bold text-text-primary">{CFTC.mmNet}</span>
                    <span className="font-mono text-sm text-green">{CFTC.change} tuần</span>
                    <span className="text-[11px] text-text-muted">hợp đồng net</span>
                  </div>
                  <div className="h-2 rounded-full bg-deep border border-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${CFTC.pct * 100}%`, background: "linear-gradient(90deg, #8a6d18, var(--gold-bright))" }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-text-muted mt-1 font-mono"><span>ngưỡng 100K</span><span>bullish</span></div>
                </div>
              </Card>
            </div>

            {/* Row 2: signal + robot */}
            <div className="grid lg:grid-cols-2 gap-5">
              <Card style={{ borderColor: "rgba(70,196,106,0.3)" }}>
                <CardHead title="Tín hiệu hôm nay · Tier 3A" right={<span className="text-[10px] text-text-muted font-mono">{SIGNAL.generated}</span>} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-bold text-[#060609]" style={{ background: "var(--green)" }}>● {SIGNAL.state}</span>
                    <div className="flex gap-4 font-mono text-xs">
                      <div><div className="text-text-muted text-[10px]">Entry</div><div className="text-text-primary">{SIGNAL.entry}</div></div>
                      <div><div className="text-text-muted text-[10px]">SL</div><div className="text-red">{SIGNAL.sl}</div></div>
                      <div><div className="text-text-muted text-[10px]">TP</div><div className="text-green">{SIGNAL.tp}</div></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {SIGNAL.drivers.map((d) => (
                      <div key={d.k} className="flex items-center justify-between rounded-md bg-deep/40 border border-border px-3 py-2">
                        <span className="text-[12.5px] text-text-secondary flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-green/15 flex items-center justify-center"><Check size={11} className="text-green" /></span>{d.k}
                        </span>
                        <span className="font-mono text-[11px] text-text-muted">{d.v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted mt-3">Cả 3 điều kiện thoả → robot sẽ vào lệnh ở nến D1 kế tiếp.</p>
                </div>
              </Card>

              <Card>
                <CardHead title="Robot của tôi" right={<span className="flex items-center gap-3"><span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-text-muted font-mono"><Circle size={6} className="fill-green text-green" /> cập nhật 18s trước</span><Link href="#" className="text-[11px] text-gold hover:text-gold-bright no-underline inline-flex items-center gap-1">Quản lý <ChevronRight size={12} /></Link></span>} />
                <div className="p-5 space-y-3">
                  {ROBOTS.map((r) => (
                    <div key={r.name} className={cn("rounded-lg border p-4", r.locked ? "border-border bg-deep/30" : "border-border bg-deep/40")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: r.accent === "steel" ? "rgba(90,169,230,0.12)" : "rgba(212,168,67,0.12)", border: `1px solid ${r.accent === "steel" ? "rgba(90,169,230,0.3)" : "rgba(212,168,67,0.3)"}` }}>
                            {r.locked ? <Lock size={14} className="text-text-muted" /> : <Bot size={15} style={{ color: r.accent === "steel" ? "#7dc0f0" : "var(--gold-bright)" }} />}
                          </span>
                          <div>
                            <div className="text-sm font-semibold">{r.name} <span className="text-[10px] text-text-muted font-mono">{r.tf}</span></div>
                            {r.locked ? (
                              <div className="text-[11px] text-text-muted">Nâng cấp Elite để mở khoá</div>
                            ) : (
                              <div className="text-[11px] inline-flex items-center gap-1.5 text-green"><Circle size={7} className="fill-green text-green" /> Online · {r.seen}</div>
                            )}
                          </div>
                        </div>
                        {!r.locked && <span className="text-[10px] text-text-muted font-mono">{r.account}</span>}
                      </div>
                      {!r.locked && (
                        <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-xs">
                          <div><div className="text-text-muted text-[10px]">Equity</div><div className="text-text-primary">{r.equity}</div></div>
                          <div><div className="text-text-muted text-[10px]">License</div><div className="text-green text-[11px] inline-flex items-center gap-1"><ShieldCheck size={11} />{r.license}</div></div>
                          <div className="text-right"><button className="text-[11px] text-gold hover:text-gold-bright border-none bg-transparent cursor-pointer">Tải EA / .set</button></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Row 3: signal feed */}
            <Card>
              <CardHead title="Tín hiệu gần đây" right={<span className="text-[10px] text-text-muted font-mono">90 ngày</span>} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead><tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted">
                    <th className="text-left font-medium py-2.5 px-5">Ngày</th>
                    <th className="text-left font-medium py-2.5 px-3">Hướng</th>
                    <th className="text-right font-medium py-2.5 px-3">Entry</th>
                    <th className="text-right font-medium py-2.5 px-5">Kết quả</th>
                  </tr></thead>
                  <tbody className="font-mono">
                    {SIGNAL_FEED.map((s, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-2.5 px-5 text-text-secondary">{s.date}</td>
                        <td className="py-2.5 px-3"><span className="text-green text-xs">● {s.dir}</span></td>
                        <td className="py-2.5 px-3 text-right text-text-secondary">{s.entry}</td>
                        <td className={cn("py-2.5 px-5 text-right font-semibold", s.win ? "text-green" : "text-red")}>{s.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Row 4: news + calendar */}
            <div className="grid lg:grid-cols-2 gap-5">
              <Card>
                <CardHead title="Tin tức vàng" right={<Newspaper size={14} className="text-text-muted" />} />
                <div className="p-2">
                  {NEWS.map((n) => (
                    <a key={n.t} href="#" className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-deep/40 transition-colors no-underline group">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                      <div className="flex-1">
                        <div className="text-[13px] text-text-secondary group-hover:text-text-primary leading-snug">{n.t}</div>
                        <div className="text-[10px] text-text-muted mt-0.5 font-mono">{n.src} · {n.time} trước</div>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHead title="Lịch kinh tế" right={<span className="text-[10px] text-text-muted">ảnh hưởng vàng</span>} />
                <div className="p-2">
                  {CALENDAR.map((c) => (
                    <div key={c.e} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-deep/40 transition-colors">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", c.impact === "high" ? "bg-red" : "bg-gold")} />
                      <div className="flex-1 text-[13px] text-text-secondary">{c.e}</div>
                      <div className="text-[11px] text-text-muted font-mono">{c.d}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <p className="text-[11px] text-text-muted text-center pt-2">Dralvo Cockpit — bản xem trước · không phải lời khuyên đầu tư</p>
          </main>
        </div>
      </div>
    </div>
  );
}
