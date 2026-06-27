"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Download, Check, ShieldCheck, ChevronDown,
  ExternalLink, Copy, Sparkles,
} from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TIGOLD } from "@/lib/backtest-stats";
import { cn } from "@/lib/utils";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";
const EMERALD = "0,201,141";
const em = (a: number) => `rgba(${EMERALD},${a})`;
const emText = "#00c98d";

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const BROKERS = [
  { id: "exness", name: "Exness", logo: "EX", ibReady: true },
  { id: "xm", name: "XM", logo: "XM", ibReady: false },
  { id: "icmarkets", name: "IC Markets", logo: "IC", ibReady: false },
] as const;

const INSTALL_STEPS = [
  {
    title: "1. Chép file EA vào MT5",
    body: `Đóng MT5 -> Mở **File -> Open Data Folder** -> Chép file **Dralvo TiGold.ex5** vào thư mục <code class="font-mono text-[#00c98d] bg-deep px-1 rounded text-[11px]">MQL5\Experts</code> -> Mở lại MT5.`,
  },
  {
    title: "2. Kéo EA lên chart XAUUSD",
    body: `Trong <strong>Navigator -> Expert Advisors</strong>, chuột phải <strong>Refresh</strong>. Kéo <strong>Dralvo TiGold</strong> thả vào chart <strong>XAUUSD M1</strong>. Tab <strong>Common</strong>: tick <strong>Allow Algo Trading</strong>.`,
  },
  {
    title: "3. Nạp file .set",
    body: `Tab <strong>Inputs -> Load</strong> -> chọn <strong>Dralvo tigold v1.set</strong>. Kiểm tra <code class="font-mono text-[#00c98d] bg-deep px-1 rounded text-[11px]">InpFixedLot</code> phù hợp vốn của bạn. Bấm <strong>OK</strong>.`,
  },
  {
    title: "4. Bật Auto Trading",
    body: `Bật nút <strong>Algo Trading</strong> trên thanh công cụ (biểu tượng phải sáng xanh). Góc trái chart sẽ hiện bảng <strong>DRALVO TiGOLD</strong> -> EA đang chạy.`,
  },
];

const FAQ_ITEMS = [
  ["EA có cần VPS không?", "Khuyến nghị dùng VPS để EA chạy 24/5 không gián đoạn. Có thể thuê VPS giá rẻ (~$5-10/tháng) và cài MT5 lên đó."],
  ["Tôi dùng được tài khoản demo không?", "Được. Mở tài khoản demo qua link IB Dralvo, xác nhận số tài khoản demo — bạn vẫn nhận được EA miễn phí."],
  ["Sao PF chỉ 1.20 mà vẫn lãi?", "Vì 21,005 lệnh trong 3.5 năm (~16 lệnh/ngày). Edge mỏng nhưng volume cực lớn -> lợi nhuận tích lũy. Đây là style高频 khác với GoldMaster (PF 2.65, 141 lệnh)."],
  ["Tôi đổi broker được không?", "Được. Mỗi broker cần mở tài khoản mới qua link IB Dralvo. Sau đó xác nhận lại để tải EA."],
];

/* -------------------------------------------------------------------------- */
/*  Components                                                                 */
/* -------------------------------------------------------------------------- */

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("relative py-16 px-6", className)}>{children}</section>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium border border-border text-text-muted" style={{ background: "rgba(26,26,42,0.4)" }}>{children}</div>
  );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span className={cn("shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors", done ? "border-[#00c98d] bg-[#00c98d] text-[#060609]" : "border-border text-text-muted")}>
      {done ? <Check size={14} /> : n}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TiGoldPage() {
  const [broker, setBroker] = useState("");
  const [account, setAccount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [downloads, setDownloads] = useState<{ ex5: string; set: string; guide: string } | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const selectedBroker = BROKERS.find((b) => b.id === broker);

  const verify = async () => {
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/ib/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, broker }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setVerified(true);
        setDownloads(data.downloads);
      } else {
        setError(data.error || "Xác nhận thất bại. Vui lòng thử lại.");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
    setVerifying(false);
  };

  const copyIB = () => {
    if (selectedBroker?.ibReady) {
      navigator.clipboard.writeText("https://one.exness-track.com/a/dralvo");
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true"><div className="v1" /><div className="v2" /><div className="v3" /><div className="h1" /><div className="h2" /></div>

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[13px] text-text-muted hover:text-gold transition-colors no-underline">Trang chủ</Link>
            <Link href="/#pricing" className="text-[13px] text-text-muted hover:text-gold transition-colors no-underline">Bảng giá</Link>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="pt-16">
        {/* Hero */}
        <Section className="overflow-hidden">
          <GlowOrb className="w-[700px] h-[600px] -top-40 -right-40 opacity-60" />
          <div className="max-w-[900px] mx-auto relative z-10 text-center">
            <Eyebrow>Dralvo · Miễn phí trọn đời</Eyebrow>
            <h1 className="text-4xl sm:text-6xl font-normal tracking-[-0.02em] mt-6 mb-5" style={{ fontFamily: SERIF }}>
              Dralvo <span style={{ color: emText }}>TiGold</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-[560px] mx-auto mb-8 leading-relaxed">
              EA thích ứng cho XAUUSD — miễn phí khi mở tài khoản qua đối tác IB của Dralvo. 3 lớp bảo vệ vốn, trailing stop thông minh.
            </p>

            {/* KPI strip */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 mb-6">
              {TIGOLD.headline.map((kpi, i) => (
                <span key={i} className={cn("px-4 py-2 rounded-lg border font-mono text-sm", kpi.tone === "good" ? "border-[#00c98d]/30 bg-[#00c98d]/10 text-green" : kpi.tone === "bad" ? "border-red/20 bg-red/5 text-red" : "border-border bg-card text-text-secondary")}>{kpi.value}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted">
              <span style={{ color: emText }}>M1</span><span>·</span>
              <span>3.5Y backtest</span><span>·</span>
              <span>100% ticks</span><span>·</span>
              <span>21,005 trades</span>
            </div>
          </div>
        </Section>

        {/* Step 1: IB Registration */}
        <Section className="bg-surface">
          <div className="max-w-[720px] mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <StepBadge n={1} done={!!selectedBroker} />
              <div>
                <h2 className="text-2xl font-normal tracking-[-0.01em]" style={{ fontFamily: SERIF, color: !selectedBroker ? emText : "var(--text-primary)" }}>
                  {!selectedBroker ? "Bước 1 — Mở tài khoản qua IB Dralvo" : "✓ Đã chọn broker"}
                </h2>
                <p className="text-sm text-text-secondary mt-1">Chọn broker và mở tài khoản qua link đối tác của Dralvo.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {BROKERS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBroker(b.id); setVerified(false); setError(""); }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all cursor-pointer",
                    broker === b.id
                      ? "border-[#00c98d]/50 bg-[#00c98d]/8"
                      : "border-border bg-card hover:border-[#00c98d]/20",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-lg font-bold" style={{ color: broker === b.id ? emText : "var(--text-primary)" }}>{b.logo}</span>
                    {b.ibReady && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: em(0.15), color: emText }}>IB ready</span>}
                    {!b.ibReady && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono text-text-muted bg-border/30">Sắp có</span>}
                  </div>
                  <div className="text-sm font-medium text-text-primary">{b.name}</div>
                </button>
              ))}
            </div>

            {selectedBroker?.ibReady && (
              <div className="rounded-xl border p-5" style={{ borderColor: em(0.3), background: em(0.04) }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-primary mb-1">Link IB Dralvo: {selectedBroker.name}</div>
                    <div className="font-mono text-xs text-text-muted break-all">https://one.exness-track.com/a/dralvo</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={copyIB} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                      {copyOk ? <><Check size={13} />Đã copy</> : <><Copy size={13} />Copy link</>}
                    </button>
                    <a href="https://one.exness-track.com/a/dralvo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[#060609] no-underline transition-transform hover:scale-[1.03]" style={{ background: emText }}>
                      Mở tài khoản <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Step 2: Verify */}
        <Section>
          <div className="max-w-[720px] mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <StepBadge n={2} done={verified} />
              <div>
                <h2 className="text-2xl font-normal tracking-[-0.01em]" style={{ fontFamily: SERIF, color: !verified ? emText : "var(--text-primary)" }}>
                  {!verified ? "Bước 2 — Xác nhận tài khoản MT5" : "✓ Tài khoản đã xác nhận"}
                </h2>
                <p className="text-sm text-text-secondary mt-1">Nhập số tài khoản MT5 bạn vừa mở qua link IB.</p>
              </div>
            </div>

            {!verified ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => { setAccount(e.target.value); setError(""); }}
                    placeholder="Số tài khoản MT5 (6-10 chữ số)"
                    className="flex-1 px-4 py-3 rounded-md border border-border bg-deep text-text-primary text-sm font-mono outline-none focus:border-[#00c98d]/50 transition-colors"
                    disabled={!selectedBroker?.ibReady}
                  />
                  <button
                    type="button"
                    onClick={verify}
                    disabled={!account || verifying || !selectedBroker?.ibReady}
                    className="px-6 py-3 rounded-md text-sm font-semibold text-[#060609] transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: emText }}
                  >
                    {verifying ? "Đang kiểm tra..." : "Xác nhận"}
                  </button>
                </div>
                {error && <p className="text-red text-xs">{error}</p>}
                {!selectedBroker && <p className="text-text-muted text-xs mt-2">Vui lòng chọn broker ở Bước 1 trước.</p>}
                {selectedBroker && !selectedBroker.ibReady && <p className="text-text-muted text-xs mt-2">Broker này sắp có IB. Vui lòng chọn Exness.</p>}
              </div>
            ) : (
              <div className="rounded-xl border p-5 flex items-center gap-3" style={{ borderColor: em(0.3), background: em(0.04) }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: em(0.15) }}>
                  <Check size={20} style={{ color: emText }} />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">Tài khoản #{account} — {selectedBroker?.name}</div>
                  <div className="text-xs text-text-muted">Đã xác nhận qua IB Dralvo. Tải EA ở bước 3.</div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Step 3: Download + Install */}
        <Section className="bg-surface">
          <div className="max-w-[720px] mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <StepBadge n={3} done={verified} />
              <div>
                <h2 className="text-2xl font-normal tracking-[-0.01em]" style={{ fontFamily: SERIF, color: verified ? emText : "var(--text-muted)" }}>
                  Bước 3 — Tải EA & cài đặt
                </h2>
                <p className="text-sm text-text-secondary mt-1">Tải file EA, nạp preset, và bắt đầu giao dịch.</p>
              </div>
            </div>

            {verified && downloads ? (
              <>
                <div className="grid sm:grid-cols-3 gap-3 mb-10">
                  {[
                    { label: "EA (.ex5)", href: downloads.ex5, desc: "Dralvo TiGold.ex5" },
                    { label: "Preset (.set)", href: downloads.set, desc: "Dralvo tigold v1.set" },
                    { label: "Hướng dẫn", href: downloads.guide, desc: "HTML · mở bằng trình duyệt" },
                  ].map((f) => (
                    <a
                      key={f.label}
                      href={f.href}
                      download
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-card text-center no-underline transition-all hover:border-[#00c98d]/30 hover:bg-[#00c98d]/5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: em(0.12) }}>
                        <Download size={20} style={{ color: emText }} />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{f.label}</span>
                      <span className="text-[10px] text-text-muted font-mono">{f.desc}</span>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <Download size={22} className="text-text-muted" />
                </div>
                <p className="text-text-muted text-sm">Hoàn thành Bước 1 & 2 để mở khóa tải về.</p>
              </div>
            )}

            {/* Install guide */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Sparkles size={18} style={{ color: emText }} />
                Hướng dẫn cài đặt
              </h3>
              <div className="space-y-2">
                {INSTALL_STEPS.map((step, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: em(0.12), color: emText }}>{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary flex-1">{step.title}</span>
                      <ChevronDown size={16} className={cn("text-text-muted transition-transform", faqOpen === i && "rotate-180")} />
                    </button>
                    {faqOpen === i && (
                      <div className="px-5 pb-4 pl-14">
                        <p className="text-[13px] leading-relaxed text-text-secondary" dangerouslySetInnerHTML={{ __html: step.body.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code class='font-mono text-[#00c98d] bg-deep px-1 py-0.5 rounded text-[11px]'>$1</code>") }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section>
          <div className="max-w-[720px] mx-auto">
            <h2 className="text-2xl font-normal tracking-[-0.01em] mb-8 text-center" style={{ fontFamily: SERIF }}>Câu hỏi thường gặp</h2>
            <div className="space-y-2">
              {FAQ_ITEMS.map(([q, a], i) => (
                <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                  <button type="button" onClick={() => setFaqOpen(faqOpen === i + 100 ? null : i + 100)} className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer">
                    <span className="text-sm font-medium text-text-primary">{q}</span>
                    <ChevronDown size={16} className={cn("text-text-muted transition-transform", faqOpen === i + 100 && "rotate-180")} />
                  </button>
                  {faqOpen === i + 100 && <div className="px-5 pb-4"><p className="text-[13px] leading-relaxed text-text-secondary">{a}</p></div>}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Backtest summary */}
        <Section className="bg-surface">
          <div className="max-w-[720px] mx-auto">
            <h2 className="text-2xl font-normal tracking-[-0.01em] mb-8 text-center" style={{ fontFamily: SERIF }}>Hiệu suất backtest</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-deep/40 flex items-center gap-2">
                <ShieldCheck size={14} style={{ color: emText }} />
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: emText }}>MT5 Strategy Tester · 01/2023–06/2026 · 100% ticks</span>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                {TIGOLD.tradeStats.map((s) => (
                  <div key={s.key} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-[11px] uppercase tracking-[0.04em] text-text-muted">{s.key === "trades" ? "Tổng lệnh" : s.key === "winRate" ? "Tỷ lệ thắng" : s.key === "avgWin" ? "Lãi TB" : s.key === "avgLoss" ? "Lỗ TB" : s.key === "rr" ? "Lãi/Lỗ" : "Chuỗi T/B"}</span>
                    <span className="font-mono text-sm text-text-primary">{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-5 py-3 bg-deep/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">Lợi nhuận ròng</span>
                  <span className="font-mono text-lg font-bold text-green">{TIGOLD.headline[0].value}</span>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLink logoSize={28} wordmarkClassName="text-sm" />
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-text-muted hover:text-gold transition-colors no-underline">Trang chủ</Link>
            <Link href="/#products" className="text-xs text-text-muted hover:text-gold transition-colors no-underline">Sản phẩm</Link>
            <Link href="/#pricing" className="text-xs text-text-muted hover:text-gold transition-colors no-underline">Bảng giá</Link>
            <a href="https://t.me/dralvo" target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-gold transition-colors no-underline">Telegram</a>
          </div>
          <p className="text-[10px] text-text-muted">© 2026 Dralvo Capital.</p>
        </div>
      </footer>
    </div>
  );
}
