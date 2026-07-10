// Public onboarding guide — "Chạy thử BOT DEMO từ A→Z". Demo-first funnel page:
// create Dralvo account → open a demo on any broker → get a demo key from the
// admin → install the EA in MT5 → run. Vietnamese (ads/onboarding audience).
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Home } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";

export const metadata: Metadata = {
  title: "Hướng dẫn chạy thử BOT DEMO từ A→Z | Dralvo",
  description:
    "Hướng dẫn từng bước cho người mới: tạo tài khoản Dralvo, mở tài khoản demo trên sàn bất kỳ, lấy license key từ admin, cài EA vào MetaTrader 5 và bật chạy thử miễn phí (không rủi ro).",
};

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";
const TELEGRAM_SUPPORT = "https://t.me/dralvoea";
const TELEGRAM_ADMIN = "https://t.me/edgardinh86";

/* -------------------------------------------------------------------------- */
/*  Presentational helpers                                                     */
/* -------------------------------------------------------------------------- */
function Callout({
  variant,
  title,
  children,
}: {
  variant: "tip" | "warn" | "note";
  title: string;
  children: React.ReactNode;
}) {
  const style = {
    tip: { bg: "rgba(0,201,141,0.08)", border: "rgba(0,201,141,0.35)", color: "#00c98d" },
    warn: { bg: "rgba(224,80,80,0.08)", border: "rgba(224,80,80,0.35)", color: "#e07050" },
    note: { bg: "rgba(212,168,67,0.08)", border: "rgba(212,168,67,0.35)", color: "#d4af37" },
  }[variant];
  return (
    <div className="rounded-xl border px-4 py-3 my-3 text-[13px] leading-relaxed text-text-secondary"
      style={{ background: style.bg, borderColor: style.border }}>
      <span className="block font-semibold mb-1" style={{ color: style.color }}>{title}</span>
      {children}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-border bg-card/60 pl-5 pr-4 py-4 my-3">
      <span className="absolute -top-3 left-4 grid place-items-center w-7 h-7 rounded-full bg-gold-bright text-[#060609] text-sm font-bold">{n}</span>
      <h3 className="text-[15px] font-semibold text-text-primary mt-1.5 mb-1.5">{title}</h3>
      <div className="text-[13px] leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[12px] px-1.5 py-0.5 rounded-md bg-deep border border-border text-gold">{children}</code>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl sm:text-3xl font-normal tracking-[-0.01em] mb-4 pb-2 border-b-2 border-gold/40 text-text-primary"
      style={{ fontFamily: SERIF }}>
      {children}
    </h2>
  );
}

const BOTS = [
  { name: "TiGold", tag: "khuyên dùng", tf: "M1", who: "Người mới, vốn nhỏ", note: "KHÔNG martingale, có 3 lớp bảo vệ vốn. An toàn nhất để làm quen." },
  { name: "GoldScalp", tag: "", tf: "M15", who: "Trader chủ động", note: "Scalp theo momentum, đọc trạng thái thị trường." },
  { name: "GoldMaster", tag: "", tf: "D1", who: "Đầu tư dài hạn", note: "Chỉ MUA, lọc theo vị thế tổ chức (CFTC). Có thể “0 lệnh” nhiều ngày = bình thường." },
  { name: "GoldWave", tag: "⚠ rủi ro cao", tf: "M1", who: "Người đã hiểu rủi ro", note: "Dùng SAR-Martingale — bắt buộc chạy demo trước, preset Safe, đủ vốn." },
];

const FLOW = [
  "Tạo tài khoản Dralvo",
  "Mở tài khoản DEMO trên sàn",
  "Lấy KEY demo từ admin",
  "Cài bot vào MT5",
  "Nhập key & bật chạy",
];

const TROUBLE: [string, React.ReactNode][] = [
  ["Bot không vào lệnh", <>Chưa bật Algo Trading · sai khung thời gian · license hết hạn · hoặc đơn giản là <b className="text-text-primary">chưa tới tín hiệu</b> (chờ thêm).</>],
  ["Báo “License invalid / expired”", <>Sai số tài khoản (key gắn 1 TK) hoặc hết 3–5 ngày → nhắn <b className="text-text-primary">@edgardinh86</b> cấp lại/gia hạn.</>],
  ["Lỗi WebRequest", <>Chưa thêm <K>https://www.dralvo.com</K> vào Tools → Options → Expert Advisors → Allow WebRequest.</>],
  ["Mặt buồn 🙁 ở góc chart", <>Nút <b className="text-text-primary">Algo Trading</b> tổng chưa bật, hoặc chưa tick “Allow Algo Trading” khi gắn bot.</>],
  ["GoldMaster “0 lệnh” nhiều ngày", <><b className="text-text-primary">Bình thường</b> — GoldMaster chỉ mua khi tổ chức bullish (CFTC). Không phải lỗi.</>],
  ["Không tìm thấy XAUUSD", <>Ctrl+M → chuột phải → Symbols/Show All → tìm XAUUSD/GOLD → thêm.</>],
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function HuongDanPage() {
  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" /><div className="h1" /><div className="h2" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-deep/85 backdrop-blur-xl">
        <div className="max-w-[900px] mx-auto px-5 h-14 flex items-center justify-between gap-3">
          <BrandLink logoSize={28} wordmarkClassName="text-base" />
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-text-secondary hover:text-gold border border-border no-underline transition-colors">
              <Home size={14} /> Trang chủ
            </Link>
            <a href={TELEGRAM_ADMIN} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold bg-gold-bright text-[#060609] no-underline transition-transform hover:scale-[1.03]">
              Xin key <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </header>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative pt-14 pb-10 px-5 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[700px] h-[520px] -top-60 -right-32" />
          <div className="max-w-[900px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium border border-border text-text-muted mb-5" style={{ background: "rgba(26,26,42,0.4)" }}>
              Hướng dẫn cho người mới
            </div>
            <h1 className="text-4xl sm:text-5xl font-normal leading-[1.08] tracking-[-0.015em] mb-4" style={{ fontFamily: SERIF }}>
              Chạy thử <span className="text-gold-bright">BOT DEMO</span> từ A → Z
            </h1>
            <p className="text-base text-text-secondary leading-relaxed max-w-[640px]">
              Dành cho người <b className="text-text-primary">chưa từng chạy bot</b>. Làm theo từng bước là setup được:
              tạo tài khoản → lấy key → mở demo trên sàn bất kỳ (Exness, XM…) → cài bot → bật chạy.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["⏱ ~15–20 phút", "💻 Windows / VPS", "🆓 Miễn phí — chạy demo", "🛡 Không rủi ro (tiền ảo)"].map((t) => (
                <span key={t} className="text-[12px] px-3 py-1.5 rounded-full border border-border text-text-secondary" style={{ background: "rgba(255,255,255,0.03)" }}>{t}</span>
              ))}
            </div>
            <p className="mt-5 text-[12px] text-text-muted">
              Cần hỗ trợ bất kỳ bước nào: nhắn Telegram <a href={TELEGRAM_SUPPORT} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@dralvoea</a>
              {" · "}Lấy/gia hạn key: <a href={TELEGRAM_ADMIN} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@edgardinh86</a>
              {" · "}Web: dralvo.com
            </p>
          </div>
        </section>

        <div className="max-w-[900px] mx-auto px-5 pb-24">
          {/* Overview */}
          <section className="mb-12">
            <SectionTitle id="tong-quan">Bạn sẽ làm gì? (toàn cảnh 5 bước)</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {FLOW.map((f, i) => (
                <div key={f} className="rounded-lg border border-border bg-card/60 border-t-2 border-t-gold px-3 py-2.5 text-center text-[11px] text-text-secondary">
                  <span className="block text-lg font-bold text-gold-bright">{i + 1}</span>{f}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-text-muted mb-3">
              Toàn bộ chạy trên <b className="text-text-primary">tài khoản DEMO</b> (tiền ảo) — bạn chỉ quan sát bot vào/thoát lệnh để tự kiểm chứng, <b className="text-text-primary">không mất đồng nào</b>.
            </p>

            <Callout variant="tip" title="✅ Chọn bot nào để thử? (người mới nên bắt đầu TiGold)">
              Mỗi bot chạy trên biểu đồ <b className="text-text-primary">XAUUSD (Vàng)</b> nhưng KHÁC khung thời gian. Nhớ kỹ cột “Khung” để gắn đúng.
            </Callout>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px] my-3">
                <thead>
                  <tr>
                    {["Bot", "Khung", "Hợp với", "Đặc điểm & rủi ro"].map((h) => (
                      <th key={h} className="border border-border bg-surface px-3 py-2 text-left font-semibold text-text-primary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOTS.map((b) => (
                    <tr key={b.name}>
                      <td className="border border-border px-3 py-2 align-top">
                        <b className="text-text-primary">{b.name}</b>{" "}
                        {b.tag && <span className={b.tag.includes("rủi ro") ? "text-red" : "text-text-muted"}>({b.tag})</span>}
                      </td>
                      <td className="border border-border px-3 py-2 align-top font-mono text-gold">{b.tf}</td>
                      <td className="border border-border px-3 py-2 align-top text-text-secondary">{b.who}</td>
                      <td className="border border-border px-3 py-2 align-top text-text-secondary">{b.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Callout variant="note" title="ℹ️ Cần chuẩn bị">
              • 1 máy tính Windows (hoặc VPS chạy 24/5).<br />
              • Ứng dụng <b className="text-text-primary">MetaTrader 5 (MT5)</b> — hướng dẫn tải ở Bước 2.<br />
              • Tài khoản Telegram (để lấy key từ admin).
            </Callout>
            <Callout variant="warn" title="⚠️ Đọc trước — kỳ vọng đúng">
              Kết quả trên <b className="text-text-primary">DEMO có thể khác tài khoản thật</b> (chênh spread, tốc độ khớp lệnh). Demo giúp bạn thấy <b className="text-text-primary">cách bot hoạt động</b>, không phải con số lợi nhuận cuối cùng. Giao dịch vàng có đòn bẩy, luôn có rủi ro — hãy bắt đầu thận trọng.
            </Callout>
          </section>

          {/* Step 1 */}
          <section className="mb-12">
            <SectionTitle id="buoc-1">Bước 1 — Tạo tài khoản Dralvo</SectionTitle>
            <p className="text-[13px] text-text-muted mb-1">License key luôn gắn với 1 tài khoản Dralvo (email). Không có tài khoản Dralvo thì không cấp được key.</p>
            <Step n={1} title="Vào trang đăng ký">
              Mở trình duyệt → truy cập <b className="text-text-primary">dralvo.com/signup</b> (hoặc vào dralvo.com bấm <b className="text-text-primary">“Đăng ký / Sign up”</b>).
            </Step>
            <Step n={2} title="Điền thông tin">
              Nhập <b className="text-text-primary">email</b> + <b className="text-text-primary">mật khẩu</b> → bấm <b className="text-text-primary">Đăng ký</b>. Dùng email thật (để nhận key và đăng nhập sau này).
            </Step>
            <Step n={3} title="Đăng nhập & ghi nhớ">
              Đăng nhập vào <b className="text-text-primary">dralvo.com/dashboard</b>. Đây là nơi bạn <b className="text-text-primary">tải file bot</b> và <b className="text-text-primary">xem license key</b> sau khi được cấp.
            </Step>
            <Callout variant="tip" title="✅ Xong Bước 1">
              Bạn đã có <b className="text-text-primary">email tài khoản Dralvo</b>. Giữ lại email này — sẽ cần khi xin key ở Bước 3.
            </Callout>
            <Link href="/signup?redirect=/dashboard" className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-gold-bright text-[#060609] no-underline transition-transform hover:scale-[1.02]">
              Tạo tài khoản Dralvo ngay <ArrowUpRight size={15} />
            </Link>
          </section>

          {/* Step 2 */}
          <section className="mb-12">
            <SectionTitle id="buoc-2">Bước 2 — Cài MT5 & mở tài khoản DEMO trên sàn</SectionTitle>
            <p className="text-[13px] text-text-muted mb-1">Bạn có thể dùng <b className="text-text-primary">sàn bất kỳ</b> (Exness, XM, GTC…). Dưới đây lấy <b className="text-text-primary">Exness</b> làm ví dụ — sàn khác thao tác tương tự.</p>
            <Step n={1} title="Tải & cài MetaTrader 5">
              Tải MT5 từ trang sàn (Exness → mục <b className="text-text-primary">Downloads/Tải xuống</b> → MetaTrader 5 cho Windows), hoặc từ <b className="text-text-primary">metatrader5.com</b>. Cài như phần mềm bình thường rồi mở lên.
            </Step>
            <Step n={2} title="Tạo tài khoản DEMO trên sàn">
              <b className="text-text-primary">Ví dụ Exness:</b> đăng ký tài khoản Exness → vào <b className="text-text-primary">Khu vực cá nhân</b> → <b className="text-text-primary">Mở tài khoản mới</b> → chọn <b className="text-text-primary">Demo</b> → nền tảng <b className="text-text-primary">MetaTrader 5</b> → loại <b className="text-text-primary">Standard</b> → đặt số dư ảo (vd 10.000 USD) → <b className="text-text-primary">Tạo</b>.
              <Callout variant="note" title="📝 Ghi lại 3 thông tin này">
                <b className="text-text-primary">Số tài khoản (Login)</b> · <b className="text-text-primary">Mật khẩu</b> · <b className="text-text-primary">Server</b> (vd <K>Exness-MT5Trial8</K>). Cần để đăng nhập MT5 và để xin key.
              </Callout>
            </Step>
            <Step n={3} title="Đăng nhập tài khoản demo vào MT5">
              Mở MT5 → menu <b className="text-text-primary">File → Login to Trade Account</b> → nhập <b className="text-text-primary">Login</b> / <b className="text-text-primary">Password</b> / chọn đúng <b className="text-text-primary">Server</b> demo của sàn → <b className="text-text-primary">OK</b>. Góc dưới phải hiện “kết nối” là được.
            </Step>
            <Callout variant="tip" title="✅ Dùng sàn khác (XM, IC Markets, GTC…)?">
              Cách làm giống hệt: tìm mục <b className="text-text-primary">“Demo account / Tài khoản thử nghiệm”</b> trên sàn đó → tạo tài khoản <b className="text-text-primary">MT5 demo</b> → lấy Login/Password/Server → đăng nhập vào MT5. Bot chạy được trên MT5 của <b className="text-text-primary">mọi sàn</b>.
            </Callout>
          </section>

          {/* Step 3 */}
          <section className="mb-12">
            <SectionTitle id="buoc-3">Bước 3 — Lấy KEY DEMO từ admin</SectionTitle>
            <p className="text-[13px] text-text-muted mb-1">Key demo được admin cấp thủ công, dùng thử <b className="text-text-primary">3–5 ngày</b>, gắn với tài khoản demo của bạn.</p>
            <Step n={1} title="Nhắn admin trên Telegram">
              Mở Telegram → tìm <b className="text-text-primary">@edgardinh86</b> → nhắn tin. (<a href={TELEGRAM_ADMIN} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">mở nhanh</a>)
            </Step>
            <Step n={2} title="Gửi đúng 4 thông tin này">
              <ul className="list-disc pl-5 space-y-1 my-1">
                <li><b className="text-text-primary">Email tài khoản Dralvo</b> (đã tạo ở Bước 1)</li>
                <li><b className="text-text-primary">Số tài khoản demo</b> (Login ở Bước 2)</li>
                <li><b className="text-text-primary">Tên sàn</b> đang dùng (vd Exness)</li>
                <li><b className="text-text-primary">Bot muốn thử</b> (vd TiGold)</li>
              </ul>
              <Callout variant="note" title="💬 Mẫu tin nhắn">
                “Chào admin, mình muốn <b className="text-text-primary">chạy thử demo</b>. Email Dralvo: <K>ban@gmail.com</K> · TK demo: <K>1234567</K> · Sàn: Exness · Bot: TiGold.”
              </Callout>
            </Step>
            <Step n={3} title="Nhận key">
              Admin gửi lại <b className="text-text-primary">license key</b> (dạng chuỗi ký tự) — <b className="text-text-primary">copy & lưu lại</b>. Key này gắn với số tài khoản demo bạn đã gửi, nên chỉ chạy đúng trên tài khoản đó.
            </Step>
            <Callout variant="warn" title="⚠️ Lưu ý">
              Key <b className="text-text-primary">gắn 1 tài khoản</b>. Nếu sau này đổi số tài khoản demo khác, phải xin key mới. Hết 3–5 ngày muốn tiếp → nhắn <b className="text-text-primary">@edgardinh86</b> gia hạn.
            </Callout>
          </section>

          {/* Step 4 */}
          <section className="mb-12">
            <SectionTitle id="buoc-4">Bước 4 — Cài bot (EA) vào MT5</SectionTitle>
            <p className="text-[13px] text-text-muted mb-1">Đây là bước quan trọng nhất. Làm chậm & đúng thứ tự.</p>
            <Step n={1} title="Tải file bot từ dashboard">
              Vào <b className="text-text-primary">dralvo.com/dashboard</b> → mở thẻ bot bạn thử (vd TiGold) → tải <b className="text-text-primary">file bot</b> (đuôi <K>.ex5</K>) và <b className="text-text-primary">file preset</b> (đuôi <K>.set</K>) nếu có. (Không thấy? Nhắn admin gửi.)
            </Step>
            <Step n={2} title="Mở thư mục dữ liệu MT5">
              Trong MT5: <b className="text-text-primary">File → Open Data Folder</b> → mở thư mục <b className="text-text-primary">MQL5</b> → mở thư mục <b className="text-text-primary">Experts</b>.
            </Step>
            <Step n={3} title="Chép file bot vào">
              Kéo/copy file <K>.ex5</K> vào thư mục <b className="text-text-primary">Experts</b>. (Nếu có file <K>.set</K>, chép vào thư mục <b className="text-text-primary">MQL5 → Presets</b>.) Đóng cửa sổ thư mục.
            </Step>
            <Step n={4} title="Làm mới danh sách EA">
              Về MT5 → mở bảng <b className="text-text-primary">Navigator</b> (phím <K>Ctrl+N</K>) → chuột phải <b className="text-text-primary">Expert Advisors</b> → <b className="text-text-primary">Refresh</b>. Bạn sẽ thấy tên bot xuất hiện.
            </Step>
            <Step n={5} title="Cho phép kết nối tới Dralvo (WebRequest) — LÀM TRƯỚC khi gắn bot">
              Menu <b className="text-text-primary">Tools → Options → Expert Advisors</b> → tick <b className="text-text-primary">“Allow WebRequest for listed URL”</b> → bấm dấu <b className="text-text-primary">+</b> thêm dòng: <K>https://www.dralvo.com</K> → <b className="text-text-primary">OK</b>.
              <Callout variant="warn" title="⚠️ Phải bật bước này TRƯỚC khi gắn bot">
                Bot cần kết nối để kiểm tra license (và GoldMaster cần dữ liệu CFTC). Nếu gắn bot khi chưa cho phép WebRequest, bot sẽ báo <b className="text-text-primary">lỗi license</b> ngay từ đầu.
              </Callout>
            </Step>
            <Step n={6} title="Mở biểu đồ XAUUSD đúng khung">
              Mở biểu đồ <b className="text-text-primary">XAUUSD (Vàng)</b> → chọn đúng khung của bot: <b className="text-text-primary">TiGold M1 · GoldWave M1 · GoldScalp M15 · GoldMaster D1</b>.
              <Callout variant="note" title="Không thấy XAUUSD?">
                Bấm <K>Ctrl+M</K> (Market Watch) → chuột phải → <b className="text-text-primary">Symbols/Show All</b> → tìm <b className="text-text-primary">XAUUSD</b> (một số sàn ghi <K>GOLD</K>, <K>XAUUSDm</K>, <K>XAUUSD.i</K>) → thêm rồi mở biểu đồ.
              </Callout>
            </Step>
            <Step n={7} title="Kéo bot lên biểu đồ">
              Từ <b className="text-text-primary">Navigator</b>, kéo tên bot <b className="text-text-primary">thả vào biểu đồ XAUUSD</b> (hoặc double-click). Một cửa sổ cài đặt hiện ra → sang Bước 5.
            </Step>
          </section>

          {/* Step 5 */}
          <section className="mb-12">
            <SectionTitle id="buoc-5">Bước 5 — Nhập key, cấp quyền & bật chạy</SectionTitle>

            {/* MT5 dialog mock */}
            <div className="rounded-xl border border-border bg-card/40 p-3 my-3">
              <svg viewBox="0 0 620 240" width="100%" xmlns="http://www.w3.org/2000/svg" className="rounded-lg">
                <rect x="8" y="8" width="604" height="224" rx="8" fill="#0f141a" stroke="#2a2f37" />
                <rect x="8" y="8" width="604" height="30" rx="8" fill="#0b0e11" />
                <text x="20" y="28" fill="#e8e6e3" fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="700">TiGold — XAUUSD,M1</text>
                <rect x="20" y="48" width="90" height="24" rx="4" fill="#F0B90B" /><text x="34" y="65" fontFamily="Segoe UI, sans-serif" fontSize="12" fontWeight="700" fill="#0b0e11">Common</text>
                <rect x="112" y="48" width="78" height="24" rx="4" fill="#1a2029" stroke="#2a2f37" /><text x="126" y="65" fontFamily="Segoe UI, sans-serif" fontSize="12" fill="#c9ccd1">Inputs</text>
                <rect x="20" y="84" width="16" height="16" rx="3" fill="#1EA672" /><text x="24" y="97" fill="#fff" fontSize="12" fontWeight="800">✓</text>
                <text x="44" y="97" fontFamily="Segoe UI, sans-serif" fontSize="12.5" fontWeight="700" fill="#e8e6e3">Allow Algo Trading  (BẮT BUỘC tick)</text>
                <line x1="20" y1="116" x2="600" y2="116" stroke="#2a2f37" />
                <text x="20" y="140" fontFamily="Segoe UI, sans-serif" fontSize="12" fill="#8a9099">Tab Inputs → ô “License”:</text>
                <rect x="20" y="150" width="470" height="26" rx="4" fill="#0b0e11" stroke="#2a2f37" />
                <text x="30" y="167" fontFamily="Consolas, monospace" fontSize="12" fill="#d4af37">DRALVO-XXXXXXXX-XXXX  ← dán KEY vào đây</text>
                <text x="20" y="200" fontFamily="Segoe UI, sans-serif" fontSize="11.5" fill="#8a9099">Tab Inputs còn có nút Load để nạp file preset .set (nếu có).</text>
                <rect x="470" y="196" width="60" height="26" rx="4" fill="#2D7FF9" /><text x="486" y="213" fill="#fff" fontSize="12" fontWeight="700">OK</text>
              </svg>
              <p className="text-[11px] text-text-muted text-center mt-2">Minh hoạ cửa sổ gắn bot vào biểu đồ MT5 (tab Common + Inputs)</p>
            </div>

            <Step n={1} title="Tab “Common” — cho phép giao dịch">
              Trong cửa sổ vừa hiện, tab <b className="text-text-primary">Common</b> → tick <b className="text-text-primary">“Allow Algo Trading”</b>.
            </Step>
            <Step n={2} title="Tab “Inputs” — nạp preset & dán KEY">
              Sang tab <b className="text-text-primary">Inputs</b> → (nếu có preset) bấm <b className="text-text-primary">Load</b> chọn file <K>.set</K> → tìm ô <b className="text-text-primary">License</b> và <b className="text-text-primary">dán license key</b> admin đã gửi → <b className="text-text-primary">OK</b>.
            </Step>
            <Step n={3} title="Bật nút “Algo Trading” tổng">
              Trên thanh công cụ trên cùng MT5, bấm nút <b className="text-text-primary">“Algo Trading”</b> cho chuyển sang <b className="text-text-primary">xanh</b> (bật toàn cục).
            </Step>
            <Step n={4} title="Kiểm tra bot đã chạy">
              Góc <b className="text-text-primary">trên bên phải biểu đồ</b> có <b className="text-text-primary">mặt cười 🙂</b> = bot đang hoạt động. Mở tab <b className="text-text-primary">Experts</b> (dưới cùng) xem log — thấy dòng <b className="text-text-primary">license OK / activated</b> là thành công.
              <Callout variant="warn" title="🙁 Mặt buồn / chữ “disabled”?">
                Nghĩa là chưa bật Algo Trading (nút tổng ở Bước 3 hoặc tick ở Bước 1) → bật lại.
              </Callout>
            </Step>
            <Callout variant="tip" title="🎉 Xong! Bot đang chạy demo">
              Giờ chỉ việc <b className="text-text-primary">để MT5 mở & quan sát</b>. Bot sẽ tự vào/thoát lệnh theo tín hiệu (tùy thị trường, có thể chưa vào ngay). Xem lệnh ở tab <b className="text-text-primary">Toolbox → Trade</b>.
            </Callout>
          </section>

          {/* Notes */}
          <section className="mb-12">
            <SectionTitle id="luu-y">Lưu ý quan trọng để bot chạy đúng</SectionTitle>
            <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-text-secondary">
              <li><b className="text-text-primary">Máy phải BẬT và MT5 phải MỞ</b> thì bot mới chạy. Tắt máy/đóng MT5 = bot dừng. Muốn chạy liên tục 24/5 → dùng <b className="text-text-primary">VPS</b> (máy chủ ảo luôn bật).</li>
              <li><b className="text-text-primary">Đúng khung thời gian</b> cho từng bot (TiGold M1, GoldScalp M15, GoldMaster D1, GoldWave M1). Sai khung → bot không hoạt động đúng.</li>
              <li><b className="text-text-primary">Đúng biểu đồ XAUUSD</b> của sàn (có sàn ghi GOLD/XAUUSDm…). Gắn nhầm cặp khác là sai.</li>
              <li><b className="text-text-primary">Key gắn 1 tài khoản</b> — chạy đúng số tài khoản demo đã đăng ký key.</li>
              <li><b className="text-text-primary">GoldWave rủi ro cao</b> (martingale) — chỉ thử trên demo, dùng preset Safe.</li>
              <li><b className="text-text-primary">Demo ≠ Live</b>: spread & khớp lệnh khác. Demo để hiểu cách bot chạy.</li>
            </ul>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <SectionTitle id="su-co">Sự cố hay gặp & cách xử lý</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className="border border-border bg-surface px-3 py-2 text-left font-semibold text-text-primary w-[38%]">Hiện tượng</th>
                    <th className="border border-border bg-surface px-3 py-2 text-left font-semibold text-text-primary">Nguyên nhân & cách sửa</th>
                  </tr>
                </thead>
                <tbody>
                  {TROUBLE.map(([sym, fix], i) => (
                    <tr key={i}>
                      <td className="border border-border px-3 py-2 align-top text-text-primary font-medium">{sym}</td>
                      <td className="border border-border px-3 py-2 align-top text-text-secondary">{fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Support footer card */}
          <section className="rounded-2xl border border-gold/30 p-6" style={{ background: "linear-gradient(168deg, rgba(212,168,67,0.08), var(--bg-card) 60%)" }}>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Cần hỗ trợ?</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              <b className="text-text-primary">Hỗ trợ:</b> Telegram <a href={TELEGRAM_SUPPORT} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@dralvoea</a>
              {" · "}<b className="text-text-primary">Lấy/gia hạn key:</b> <a href={TELEGRAM_ADMIN} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@edgardinh86</a>
              {" · "}<b className="text-text-primary">Web:</b> dralvo.com
            </p>
            <p className="mt-3 text-[11px] text-text-muted leading-relaxed">
              Dralvo cung cấp công cụ giao dịch, không phải lời khuyên tài chính. Số liệu là kết quả kiểm chứng trên dữ liệu lịch sử; hiệu suất quá khứ không bảo đảm tương lai. Giao dịch XAUUSD có đòn bẩy, rủi ro mất vốn.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
