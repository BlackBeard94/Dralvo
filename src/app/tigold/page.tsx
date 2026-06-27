"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Download, Check, ShieldCheck, ChevronDown,
  ExternalLink, Copy, MessageCircle, TrendingUp, Activity,
} from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TIGOLD } from "@/lib/backtest-stats";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Design tokens (DESIGN.md)                                                  */
/* -------------------------------------------------------------------------- */
const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";
const GOLD_HEX = "#d4a92d";
const GOLD_BRIGHT = "#f0cf5a";
const alpha = (a: number) => `rgba(212,169,45,${a})`;

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */
const ACCOUNT_TYPES = [
  { id: "gtc-usd", name: "Tài khoản USD", desc: "Spread thấp, khối lượng chuẩn", ref: "hc8B8eNC" },
  { id: "gtc-cent", name: "Tài khoản Cent", desc: "Vốn nhỏ, rủi ro thấp", ref: "ADWMQMDP" },
] as const;

const INSTALL_STEPS = [
  { title: "Chép EA vào MT5", body: "Đóng MT5. <strong>File → Open Data Folder</strong>. Chép <code>Dralvo TiGold.ex5</code> vào <code>MQL5\\Experts\\</code>. Mở lại MT5." },
  { title: "Kéo EA lên chart", body: "<strong>Navigator → Expert Advisors</strong>, chuột phải <strong>Refresh</strong>. Kéo <strong>Dralvo TiGold</strong> thả vào chart <strong>XAUUSD M1</strong>. Tab Common: tick <strong>Allow Algo Trading</strong>." },
  { title: "Nạp file .set", body: "Tab <strong>Inputs → Load</strong>, chọn <strong>Dralvo tigold v1.set</strong>. Kiểm tra <code>InpFixedLot</code> phù hợp vốn. Bấm <strong>OK</strong>." },
  { title: "Bật Auto Trading", body: "Bật nút <strong>Algo Trading</strong> trên thanh công cụ (biểu tượng sáng xanh). Góc trái chart hiện bảng <strong>DRALVO TiGOLD</strong> — EA đang chạy." },
];

const FAQ_ITEMS = [
  ["EA có cần VPS không?", "Khuyến nghị dùng VPS để EA chạy 24/5 không gián đoạn. Có thể thuê VPS giá rẻ (~$5-10/tháng) và cài MT5 lên đó."],
  ["Dùng được tài khoản demo không?", "Được. Mở tài khoản demo qua link IB Dralvo, xác nhận số tài khoản demo — bạn vẫn nhận được EA miễn phí."],
  ["Sao PF chỉ 1.20 mà vẫn lãi?", "Vì 21,005 lệnh trong 3.5 năm (~16 lệnh/ngày). Edge mỏng nhưng volume cực lớn — lợi nhuận tích lũy. Đây là style khác biệt với GoldMaster (PF 2.65, 141 lệnh)."],
  ["Cần bao nhiêu vốn để bắt đầu?", "Với tài khoản Cent: ~$10-50 là đủ chạy 0.10 lot cent. Với tài khoản USD: khuyến nghị tối thiểu $100 để chịu được drawdown 22%."],
];

/* -------------------------------------------------------------------------- */
/*  Scroll reveal                                                              */
/* -------------------------------------------------------------------------- */
function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal(0.12);
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out", className)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small parts                                                                */
/* -------------------------------------------------------------------------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium border border-border text-text-muted" style={{ background: "rgba(26,26,42,0.4)" }}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function TiGoldPage() {
  const [accountType, setAccountType] = useState("");
  const [account, setAccount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [downloads, setDownloads] = useState<{ ex5: string; set: string; guide: string } | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openInstall, setOpenInstall] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const selectedType = ACCOUNT_TYPES.find((t) => t.id === accountType);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const verify = async () => {
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/ib/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account, broker: accountType }) });
      const data = await res.json();
      if (res.ok && data.verified) { setVerified(true); setDownloads(data.downloads); }
      else { setError(data.error || "Xác nhận thất bại. Vui lòng thử lại."); }
    } catch { setError("Lỗi kết nối. Vui lòng thử lại."); }
    setVerifying(false);
  };

  const copyIB = () => {
    if (selectedType) {
      navigator.clipboard.writeText(`https://web.mygtc.app/login/register?ref=${selectedType.ref}`);
      setCopyOk(true); setTimeout(() => setCopyOk(false), 2000);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      {/* Gold veins */}
      <div className="gold-veins" aria-hidden="true"><div className="v1" /><div className="v2" /><div className="v3" /><div className="h1" /><div className="h2" /></div>

      {/* Nav */}
      <nav className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-500", scrolled ? "bg-deep/85 backdrop-blur-xl border-b border-border" : "bg-transparent")}>
        <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
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
        {/* ── Hero ── */}
        <section className="relative pt-28 pb-16 px-6 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[800px] h-[600px] -top-60 -right-32 opacity-50" />
          <GlowOrb className="w-[400px] h-[400px] bottom-0 left-0 opacity-30" />
          <div className="max-w-[900px] mx-auto relative z-10 text-center">
            <Reveal><Eyebrow>Dralvo Capital · Miễn phí trọn đời</Eyebrow></Reveal>
            <Reveal delay={80}>
              <h1 className="text-[2.8rem] sm:text-6xl font-normal leading-[1.04] tracking-[-0.02em] mt-6 mb-5 text-balance" style={{ fontFamily: SERIF }}>
                Dralvo <span style={{ color: GOLD_BRIGHT }}>TiGold</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-base sm:text-lg leading-relaxed max-w-[560px] mx-auto mb-8 text-text-secondary">
                EA thích ứng cho XAUUSD — miễn phí khi mở tài khoản qua đối tác GTC của Dralvo.<br />
                3 lớp bảo vệ vốn. Trailing stop thông minh. 21,005 lệnh đã kiểm chứng.
              </p>
            </Reveal>

            {/* KPI strip — assay-style */}
            <Reveal delay={160}>
              <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
                {TIGOLD.headline.map((kpi, i) => (
                  <span key={i} className={cn("px-4 py-2 rounded-lg border font-mono text-sm font-semibold",
                    kpi.tone === "good" ? "border-green/20 bg-green/5 text-green" :
                    kpi.tone === "bad" ? "border-red/20 bg-red/5 text-red" :
                    "border-gold/20 bg-gold/5 text-gold-bright")}>{kpi.value}</span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted">
                <span className="text-gold">M1</span><span>·</span>
                <span>3.5Y backtest</span><span>·</span>
                <span>100% ticks</span><span>·</span>
                <span>21,005 trades</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Step 1: Chọn tài khoản ── */}
        <section className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[500px] h-[400px] -bottom-32 right-0 opacity-25" />
          <div className="max-w-[960px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>Bước 1</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>
                Mở tài khoản GTC qua Dralvo
              </h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">Chọn loại tài khoản, mở qua link đối tác. GTC là broker độc quyền của Dralvo.</p>
            </Reveal>

            <Reveal delay={60}>
              <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-[580px] mx-auto">
                {ACCOUNT_TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => { setAccountType(t.id); setVerified(false); setError(""); }}
                    className={cn("lift group relative rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer",
                      accountType === t.id ? "border-gold/40 bg-gold/5" : "border-border bg-card hover:border-gold/20")}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("font-semibold text-sm", accountType === t.id ? "text-gold-bright" : "text-text-primary")}>{t.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-gold/30 text-gold bg-gold/5">GTC</span>
                    </div>
                    <p className="text-[12px] text-text-muted leading-relaxed">{t.desc}</p>
                  </button>
                ))}
              </div>
            </Reveal>

            {selectedType && (
              <Reveal delay={80}>
                <div className="rounded-2xl border p-5 max-w-[580px] mx-auto" style={{ borderColor: alpha(0.25), background: alpha(0.04) }}>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-3 font-semibold">Broker: GTC · {selectedType.name}</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <code className="text-xs text-text-secondary break-all bg-deep/50 px-3 py-1.5 rounded-md">web.mygtc.app/register?ref={selectedType.ref}</code>
                    <div className="flex gap-2">
                      <button type="button" onClick={copyIB} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold border border-border text-text-secondary hover:text-gold transition-colors cursor-pointer">
                        {copyOk ? <><Check size={13} />Đã copy</> : <><Copy size={13} />Copy</>}
                      </button>
                      <a href={`https://web.mygtc.app/login/register?ref=${selectedType.ref}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]"
                        style={{ background: GOLD_BRIGHT }}>
                        Mở tài khoản <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* ── Step 2: Xác nhận ── */}
        <section className="relative py-20 px-6 overflow-hidden">
          <GlowOrb className="w-[400px] h-[400px] -top-20 -left-20 opacity-20" />
          <div className="max-w-[580px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>Bước 2</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>
                {verified ? "Tài khoản đã xác nhận" : "Xác nhận tài khoản MT5"}
              </h2>
              <p className="text-text-secondary">Nhập số tài khoản MT5 bạn vừa mở qua link IB Dralvo.</p>
            </Reveal>

            <Reveal delay={60}>
              {!verified ? (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={account} onChange={(e) => { setAccount(e.target.value); setError(""); }}
                      placeholder="Số tài khoản MT5"
                      disabled={!selectedType}
                      className="flex-1 px-4 py-3 rounded-lg border border-border bg-deep text-text-primary text-sm font-mono outline-none focus:border-gold/40 transition-colors disabled:opacity-40" />
                    <button type="button" onClick={verify} disabled={!account || verifying || !selectedType}
                      className="px-7 py-3 rounded-lg text-sm font-semibold text-[#060609] transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
                      style={{ background: GOLD_BRIGHT }}>
                      {verifying ? "Đang kiểm tra..." : "Xác nhận"}
                    </button>
                  </div>
                  {error && <p className="text-red text-xs mt-3">{error}</p>}
                  {!selectedType && <p className="text-text-muted text-xs mt-3">Chọn loại tài khoản ở bước 1 trước.</p>}
                </div>
              ) : (
                <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: alpha(0.3), background: alpha(0.04) }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: alpha(0.15) }}><Check size={20} style={{ color: GOLD_BRIGHT }} /></div>
                  <div>
                    <div className="font-semibold text-text-primary">Tài khoản #{account} — GTC · {selectedType?.name}</div>
                    <div className="text-xs text-text-muted">Đã xác nhận qua IB Dralvo.</div>
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        {/* ── Step 3: Tải EA ── */}
        <section className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[500px] h-[400px] -bottom-24 right-0 opacity-25" />
          <div className="max-w-[860px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>Bước 3</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>
                {verified ? "Tải EA & cài đặt" : "Tải EA & cài đặt"}
              </h2>
              <p className="text-text-secondary">Hoàn thành bước 1 & 2 để mở khóa tải về.</p>
            </Reveal>

            <Reveal delay={60}>
              {verified && downloads ? (
                <div className="grid sm:grid-cols-3 gap-4 mb-14">
                  {[
                    { label: "EA (.ex5)", href: downloads.ex5, desc: "Dralvo TiGold.ex5" },
                    { label: "Preset (.set)", href: downloads.set, desc: "Dralvo tigold v1.set" },
                    { label: "Hướng dẫn", href: downloads.guide, desc: "HTML · mở bằng trình duyệt" },
                  ].map((f) => (
                    <a key={f.label} href={f.href} download
                      className="lift group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card text-center no-underline transition-all duration-300 hover:border-gold/30 cursor-pointer"
                      style={{ boxShadow: `0 1px 0 ${alpha(0.08)} inset` }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: alpha(0.1) }}>
                        <Download size={22} style={{ color: GOLD_BRIGHT }} />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{f.label}</span>
                      <span className="text-[10px] text-text-muted font-mono">{f.desc}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center mb-14">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Download size={22} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted text-sm">Hoàn thành Bước 1 & 2 để mở khóa tải về.</p>
                </div>
              )}
            </Reveal>

            {/* Install guide */}
            <Reveal delay={80}>
              <h3 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full inline-block" style={{ background: GOLD_BRIGHT }} />
                Hướng dẫn cài đặt
              </h3>
              <div className="space-y-2">
                {INSTALL_STEPS.map((step, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden transition-colors duration-300 hover:border-gold/15">
                    <button type="button" onClick={() => setOpenInstall(openInstall === i ? null : i)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: alpha(0.12), color: GOLD_BRIGHT }}>{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary flex-1">{step.title}</span>
                      <ChevronDown size={16} className={cn("text-text-muted transition-transform duration-300", openInstall === i && "rotate-180")} />
                    </button>
                    <div className={cn("grid transition-all duration-300", openInstall === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-4 pl-16 text-[13px] leading-relaxed text-text-secondary"
                          dangerouslySetInnerHTML={{ __html: step.body.replace(/<code>(.+?)<\/code>/g, '<code class="font-mono text-gold bg-deep/60 px-1.5 py-0.5 rounded text-[11px]">$1</code>') }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Step 4: License ── */}
        <section className="relative py-20 px-6 overflow-hidden">
          <GlowOrb className="w-[500px] h-[400px] -top-16 right-0 opacity-25" />
          <div className="max-w-[720px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>Bước 4</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>
                Kích hoạt license
              </h2>
              <p className="text-text-secondary">EA cần license key để chạy. Nhận key miễn phí qua Telegram.</p>
            </Reveal>

            <Reveal delay={60}>
              <div className="rounded-2xl border p-7" style={{ borderColor: alpha(0.25), background: `linear-gradient(168deg, ${alpha(0.06)}, var(--bg-card) 55%)` }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: alpha(0.12) }}>
                    <MessageCircle size={28} style={{ color: GOLD_BRIGHT }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-3">Nhắn Telegram để nhận license key</h3>
                    <ol className="space-y-2 text-[13px] text-text-secondary leading-relaxed">
                      <li>1. Mở Telegram, tìm <code className="font-mono text-gold bg-deep/60 px-1.5 py-0.5 rounded text-[11px]">@dralvo</code></li>
                      <li>2. Gửi: <strong>"TiGold license [số tài khoản MT5]"</strong></li>
                      <li>3. Admin kiểm tra tài khoản thuộc IB Dralvo</li>
                      <li>4. Nhận license key → nhập vào EA → bắt đầu giao dịch</li>
                    </ol>
                  </div>
                  <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: GOLD_BRIGHT }}>
                    Mở Telegram <ExternalLink size={15} />
                  </a>
                </div>
                <p className="mt-5 text-[11px] text-text-muted border-t border-border pt-4">
                  License miễn phí vĩnh viễn cho tài khoản đăng ký qua IB Dralvo. Mỗi license gắn với 1 số tài khoản MT5.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Backtest ── */}
        <section className="relative py-20 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[600px] h-[500px] -bottom-40 left-1/2 -translate-x-1/2 opacity-20" />
          <div className="max-w-[860px] mx-auto relative z-10">
            <Reveal className="text-center mb-10">
              <Eyebrow>Hiệu suất đã kiểm chứng</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3 text-balance" style={{ fontFamily: SERIF }}>
                Số liệu nói thay lời.
              </h2>
              <p className="text-text-secondary max-w-[500px] mx-auto">MT5 Strategy Tester · 01/2023–06/2026 · 100% ticks thật (208.6M).</p>
            </Reveal>

            <Reveal delay={60}>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border bg-deep/40 flex items-center gap-2.5">
                  <ShieldCheck size={15} style={{ color: GOLD_BRIGHT }} />
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-gold">Hồ sơ rủi ro — TiGold v2.0</span>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
                  {[
                    { v: TIGOLD.headline[0].value, l: "Lợi nhuận ròng", t: "good" },
                    { v: TIGOLD.headline[1].value, l: "Profit Factor", t: "neutral" },
                    { v: TIGOLD.headline[2].value, l: "Tỷ lệ thắng", t: "neutral" },
                    { v: TIGOLD.headline[3].value, l: "Drawdown tối đa", t: "bad" },
                  ].map((k) => (
                    <div key={k.l} className="bg-card p-5">
                      <div className={cn("font-mono text-2xl font-bold tracking-tight", k.t === "good" ? "text-green" : k.t === "bad" ? "text-red" : "text-text-primary")}>{k.v}</div>
                      <div className="text-[10px] uppercase tracking-[0.06em] text-text-muted mt-1.5">{k.l}</div>
                    </div>
                  ))}
                </div>

                {/* Trade stats */}
                <div className="p-6 grid sm:grid-cols-3 gap-x-8 gap-y-3">
                  {TIGOLD.tradeStats.map((s) => (
                    <div key={s.key} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                      <span className="text-[11px] uppercase tracking-[0.04em] text-text-muted">
                        {s.key === "trades" ? "Tổng lệnh" : s.key === "winRate" ? "Tỷ lệ thắng" : s.key === "avgWin" ? "Lãi TB" : s.key === "avgLoss" ? "Lỗ TB" : s.key === "rr" ? "Lãi/Lỗ" : "Chuỗi T/B"}
                      </span>
                      <span className="font-mono text-sm text-text-primary">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Final balance highlight */}
                <div className="border-t border-border px-6 py-4 bg-deep/20 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted uppercase tracking-[0.06em]">Số dư cuối kỳ</span>
                  <span className="font-mono text-lg font-bold text-green">{TIGOLD.finalBalance}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="max-w-[720px] mx-auto">
            <Reveal className="text-center mb-10">
              <Eyebrow>Hỏi đáp</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-3" style={{ fontFamily: SERIF }}>Mọi điều bạn cần biết.</h2>
            </Reveal>
            <Reveal delay={60}>
              <div className="space-y-3">
                {FAQ_ITEMS.map(([q, a], i) => (
                  <div key={i} className="rounded-xl border transition-colors duration-300" style={{ borderColor: openFaq === i ? alpha(0.3) : "var(--border)", background: openFaq === i ? alpha(0.04) : "transparent" }}>
                    <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer">
                      <span className="text-sm font-medium text-text-primary">{q}</span>
                      <span className="shrink-0 text-base font-light text-gold transition-transform duration-300" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                    </button>
                    <div className={cn("grid transition-all duration-300", openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden"><p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">{a}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative py-24 px-6 bg-surface overflow-hidden">
          <GlowOrb className="w-[700px] h-[500px] top-0 left-1/2 -translate-x-1/2 opacity-35" />
          <GridPattern />
          <div className="max-w-[720px] mx-auto relative z-10 text-center">
            <Reveal>
              <div className="rounded-3xl border border-gold/20 p-10 sm:p-14" style={{ background: `linear-gradient(168deg, ${alpha(0.08)}, var(--bg-card) 60%)`, boxShadow: "0 40px 90px -60px rgba(240,200,90,0.4)" }}>
                <Eyebrow>Sẵn sàng?</Eyebrow>
                <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.015em] mt-5 mb-4 text-balance" style={{ fontFamily: SERIF }}>
                  Miễn phí. Vĩnh viễn. Không bắt buộc.
                </h2>
                <p className="text-text-secondary mb-8 leading-relaxed max-w-[480px] mx-auto">
                  Mở tài khoản GTC qua Dralvo, tải EA, nhận license — tất cả miễn phí. Bạn chỉ trả spread cho broker như mọi tài khoản bình thường.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="#step1" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-[15px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: GOLD_BRIGHT, boxShadow: "0 0 40px rgba(240,200,90,0.15)" }}>
                    Bắt đầu ngay <ArrowRight size={18} />
                  </a>
                  <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-[15px] font-semibold border border-border text-text-primary no-underline transition-colors hover:border-gold/30 hover:text-gold">
                    Hỏi trên Telegram <MessageCircle size={17} />
                  </a>
                </div>
                <p className="mt-6 font-mono text-[11px] tracking-[0.04em] text-text-muted">Hủy bất cứ lúc nào · Không ràng buộc · Hỗ trợ cài đặt</p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <BrandLink logoSize={28} wordmarkClassName="text-lg" />
              <p className="text-sm text-text-muted leading-relaxed max-w-[220px] mt-4">Dralvo Capital — robot giao dịch vàng tự động. Chiến lược kiểm chứng trên dữ liệu thật.</p>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">Sản phẩm</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">GoldMaster (D1)</Link>
                <Link href="/#products" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">GoldScalp (M5)</Link>
                <span className="text-sm font-medium" style={{ color: GOLD_BRIGHT }}>TiGold (miễn phí)</span>
                <Link href="/tools/calculator" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Công cụ tính lot</Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">Dralvo</div>
              <div className="flex flex-col gap-2.5">
                <a href="https://t.me/dralvoea" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Telegram</a>
                <Link href="/#pricing" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Bảng giá</Link>
                <Link href="/login" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Đăng nhập</Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-text-muted font-semibold mb-4">Pháp lý</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/privacy" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Bảo mật</Link>
                <Link href="/terms" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Điều khoản</Link>
                <Link href="/disclaimer" className="text-sm text-text-secondary hover:text-gold transition-colors no-underline">Miễn trừ trách nhiệm</Link>
              </div>
            </div>
          </div>
          <div className="pt-7 border-t border-border">
            <p className="text-[11px] text-text-muted">© 2026 Dralvo Capital.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
