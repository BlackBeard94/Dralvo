"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Copy (Vietnamese only — target market) ──────────────────────
const COPY = {
  hero: {
    line1: "Gold EA được backtest 22 năm.",
    line2: "Không fake. Không curve-fit. Chỉ 1 lệnh 1 lúc.",
  },
  stats: [
    { value: "PF 1.96", label: "Profit Factor" },
    { value: "22 năm", label: "Backtest" },
    { value: "DD 15%", label: "Max Drawdown" },
    { value: "+881%", label: "Tổng lợi nhuận" },
  ],
  backtest: {
    title: "Backtest Results — MT5 Strategy Tester",
    subtitle: "Trail 2.0 ATR · MaxHold 60 ngày · Risk 5% · 196 trades · 2006–2026",
    table: [
      ["Initial Deposit", "$10,000"],
      ["Total Net Profit", "$88,055"],
      ["Profit Factor", "1.96"],
      ["Win Rate", "36.7%"],
      ["Max Drawdown", "15.1%"],
      ["Total Trades", "196"],
      ["Avg Win / Avg Loss", "+$2,494 / -$738"],
      ["Longest Win Streak", "4"],
    ],
  },
  how: {
    title: "Cách EA hoạt động",
    steps: [
      {
        num: "01",
        title: "CFTC xác nhận xu hướng",
        desc: "Mỗi tuần EA kiểm tra báo cáo CFTC. Chỉ LONG khi Managed Money net > 100K contracts — dấu hiệu smart money đang bullish vàng.",
      },
      {
        num: "02",
        title: "Chờ pullback — không mua đuổi",
        desc: "Khi giá giảm -1% từ đỉnh 10 ngày, EMA50 vẫn trên EMA200, EA vào lệnh. Mua khi người khác sợ.",
      },
      {
        num: "03",
        title: "Trailing stop bảo vệ lợi nhuận",
        desc: "Không TP cố định. EA dùng trailing stop 2 ATR để lệnh thắng chạy đến khi xu hướng yếu. Lệnh thua cắt nhanh.",
      },
    ],
  },
  pricing: {
    title: "EA Dralvo Gold",
    price: "$39",
    period: "/tháng",
    features: [
      "EA MQL5 — cài 1 lần, chạy tự động",
      "Tự động cập nhật CFTC mỗi tuần",
      "Risk management: chỉ 1 lệnh 1 lúc",
      "Trailing stop 2 ATR — không TP cố định",
      "Chạy trên MT5, khung D1",
      "License key — không share được",
    ],
    cta: "Đăng ký ngay",
  },
  faq: [
    {
      q: "Win rate 37% — thua nhiều hơn thắng, tại sao vẫn lời?",
      a: "Mỗi lệnh thắng trung bình +$2,494, mỗi lệnh thua -$738. Tỉ lệ lời/lỗ là 3.4:1. Bạn thua 6 lần, thắng 4 lần — vẫn có lời. Đây là toán học, không phải may mắn.",
    },
    {
      q: "Có cần kinh nghiệm trade vàng không?",
      a: "Không. EA tự động phân tích và vào lệnh. Bạn chỉ cần cài MT5, gắn EA vào chart XAUUSD D1, và để nó chạy. Tuy nhiên, bạn nên hiểu cách EA hoạt động để không hoảng loạn khi drawdown.",
    },
    {
      q: "EA có chạy trên điện thoại không?",
      a: "EA chạy trên MT5 Desktop (Windows). Cần máy tính bật 24/7 hoặc VPS. Chúng tôi sẽ hướng dẫn setup VPS trong gói VIP.",
    },
    {
      q: "Có đảm bảo lợi nhuận không?",
      a: "Không. Backtest là quá khứ. Tương lai không ai biết. Chúng tôi chỉ bán công cụ — không bán lời hứa. Bạn nên test demo ít nhất 1 tháng trước khi nạp tiền thật.",
    },
    {
      q: "Nếu CFTC bearish thì sao?",
      a: "EA đứng ngoài. Không trade. Đây là lý do EA sống sót 22 năm — nó không cố gắng kiếm tiền khi thị trường bất lợi. 52% thời gian EA im lặng là lúc nó bảo vệ vốn của bạn.",
    },
  ],
  cta: {
    title: "Sẵn sàng trade với edge thật?",
    subtitle: "EA Dralvo Gold — $39/tháng qua VietQR. Hủy bất kỳ lúc nào.",
    button: "Đăng ký EA PRO",
  },
};

// ─── Design Tokens ───────────────────────────────────────────────
const tokens = {
  vault: "#050508",
  surface: "#0C0C14",
  card: "#11111C",
  divider: "#1A1A2A",
  ash: "#EDE8E0",
  dust: "#9A958A",
  patina: "#5C5852",
  gold: "#D4A843",
  bullion: "#F0C85A",
  gilt: "rgba(212,168,67,0.08)",
  giltBorder: "rgba(212,168,67,0.2)",
  verdigris: "#3BA87E",
  cinnabar: "#E8483B",
};

// ─── Components ──────────────────────────────────────────────────

function AssayMark({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono tracking-widest border transition-all ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(circle, ${tokens.gold}33, transparent)`,
      }}
    />
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-lg cursor-pointer transition-colors"
      style={{
        borderColor: open ? tokens.giltBorder : tokens.divider,
        background: open ? tokens.gilt : "transparent",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center p-4">
        <h3 className="text-sm font-medium" style={{ color: tokens.ash }}>
          {q}
        </h3>
        <span
          className="text-lg transition-transform"
          style={{
            color: tokens.gold,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </div>
      {open && (
        <div
          className="px-4 pb-4 text-sm leading-relaxed"
          style={{ color: tokens.dust }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{ background: tokens.vault, color: tokens.ash }}
    >
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: "rgba(5,5,8,0.85)", borderColor: tokens.divider }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link
            href="/"
            className="font-bold text-lg tracking-tight"
            style={{ color: tokens.bullion }}
          >
            DRALVO
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium px-4 py-2 rounded-md transition-colors"
            style={{
              background: tokens.gilt,
              color: tokens.bullion,
              border: `1px solid ${tokens.giltBorder}`,
            }}
          >
            Mua EA PRO
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6">
        <GlowOrb className="w-96 h-96 -top-20 -right-20" />
        <GlowOrb className="w-64 h-64 bottom-10 -left-20" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AssayMark
            className="mb-6"
            style={{
              color: tokens.verdigris,
              borderColor: "rgba(59,168,126,0.3)",
              background: "rgba(59,168,126,0.08)",
            }}
          >
            ✓ VERIFIED BACKTEST
          </AssayMark>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4"
            style={{ color: tokens.ash }}
          >
            {COPY.hero.line1}
          </h1>
          <p
            className="text-lg sm:text-xl mb-8"
            style={{ color: tokens.dust }}
          >
            {COPY.hero.line2}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {COPY.stats.map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-lg"
                style={{ background: tokens.card, border: `1px solid ${tokens.divider}` }}
              >
                <div
                  className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mb-1"
                  style={{ color: tokens.bullion }}
                >
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: tokens.patina }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="#pricing"
              className="px-8 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{ background: tokens.bullion, color: tokens.vault }}
            >
              Xem gói EA PRO
            </Link>
            <Link
              href="#how"
              className="px-8 py-3 rounded-lg font-semibold text-sm transition-colors border"
              style={{
                color: tokens.ash,
                borderColor: tokens.divider,
              }}
            >
              Cách hoạt động
            </Link>
          </div>
        </div>
      </section>

      {/* Backtest */}
      <section id="backtest" className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: tokens.ash }}
          >
            {COPY.backtest.title}
          </h2>
          <p className="text-sm mb-8" style={{ color: tokens.patina }}>
            {COPY.backtest.subtitle}
          </p>

          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: tokens.divider }}
          >
            <table className="w-full text-sm">
              <tbody>
                {COPY.backtest.table.map(([label, value], i) => (
                  <tr
                    key={label}
                    style={{
                      background: i % 2 === 0 ? tokens.surface : tokens.card,
                    }}
                  >
                    <td
                      className="py-3 px-5 font-medium"
                      style={{ color: tokens.dust }}
                    >
                      {label}
                    </td>
                    <td
                      className="py-3 px-5 text-right font-mono font-semibold"
                      style={{ color: tokens.ash }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs mt-3" style={{ color: tokens.patina }}>
            * Backtest chạy trên MT5 Strategy Tester, dữ liệu 2006–2026. Kết
            quả quá khứ không đảm bảo lợi nhuận tương lai.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-6" style={{ background: tokens.surface }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-10" style={{ color: tokens.ash }}>
            {COPY.how.title}
          </h2>

          <div className="space-y-8">
            {COPY.how.steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-5 p-5 rounded-lg border"
                style={{
                  background: tokens.card,
                  borderColor: tokens.divider,
                }}
              >
                <div
                  className="text-xl font-mono font-bold shrink-0"
                  style={{ color: tokens.gold }}
                >
                  {step.num}
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: tokens.ash }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: tokens.dust }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: tokens.ash }}>
            {COPY.pricing.title}
          </h2>

          <div
            className="mt-8 p-8 rounded-xl border text-left"
            style={{
              background: tokens.card,
              borderColor: tokens.giltBorder,
            }}
          >
            <div className="flex items-baseline gap-1 mb-6">
              <span
                className="text-5xl font-bold font-mono"
                style={{ color: tokens.bullion }}
              >
                {COPY.pricing.price}
              </span>
              <span style={{ color: tokens.dust }}>{COPY.pricing.period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {COPY.pricing.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: tokens.dust }}
                >
                  <span style={{ color: tokens.verdigris }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/pricing"
              className="block text-center py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{ background: tokens.bullion, color: tokens.vault }}
            >
              {COPY.pricing.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6" style={{ background: tokens.surface }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8" style={{ color: tokens.ash }}>
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-3">
            {COPY.faq.map((item) => (
              <FAQ key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <GlowOrb className="w-80 h-80 top-0 left-1/2 -translate-x-1/2" />
        <div className="max-w-lg mx-auto relative z-10">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: tokens.ash }}
          >
            {COPY.cta.title}
          </h2>
          <p className="mb-8" style={{ color: tokens.dust }}>
            {COPY.cta.subtitle}
          </p>
          <Link
            href="/pricing"
            className="inline-block px-10 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
            style={{ background: tokens.bullion, color: tokens.vault }}
          >
            {COPY.cta.button}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center text-xs border-t"
        style={{ borderColor: tokens.divider, color: tokens.patina }}
      >
        <p>© 2026 Dralvo. Không phải lời khuyên đầu tư.</p>
        <p className="mt-1">
          Backtest results are historical. Past performance ≠ future results.
        </p>
      </footer>
    </div>
  );
}
