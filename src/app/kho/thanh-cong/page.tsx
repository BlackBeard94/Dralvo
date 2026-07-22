// Landing page Cryptomus sends the buyer to after paying. The download link is
// delivered by the webhook → e-mail, which can land a few seconds later, so
// this page sets that expectation instead of promising an instant file.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MailCheck } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb } from "@/components/shared/decor";

export const metadata: Metadata = {
  title: "Thanh toán thành công | Dralvo",
  robots: { index: false, follow: false },
};

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";
const SUPPORT_TG = "https://t.me/dralvoea";

export default function ThanhCongPage() {
  return (
    <div className="min-h-screen antialiased bg-deep text-text-primary">
      <header className="border-b border-border">
        <div className="max-w-[900px] mx-auto px-5 h-14 flex items-center">
          <BrandLink logoSize={28} wordmarkClassName="text-base" />
        </div>
      </header>

      <main className="relative px-5 py-24" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <GlowOrb className="w-[600px] h-[420px] -top-32 left-1/2 -translate-x-1/2 opacity-40" />
        <div className="max-w-[560px] mx-auto relative z-10 text-center">
          <div className="inline-grid place-items-center w-16 h-16 rounded-full bg-gold/10 border border-gold/30 mb-6">
            <MailCheck className="h-7 w-7 text-gold-bright" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal leading-[1.15] tracking-[-0.015em] mb-4" style={{ fontFamily: SERIF }}>
            Cảm ơn bạn! Đang xác nhận thanh toán…
          </h1>
          <p className="text-text-secondary leading-relaxed">
            Ngay khi mạng lưới xác nhận giao dịch, <b className="text-text-primary">link tải sẽ được gửi vào email</b> bạn
            đã nhập. Thường mất vài phút — nhớ kiểm tra cả mục <b className="text-text-primary">Spam / Quảng cáo</b>.
          </p>
          <p className="text-[13px] text-text-muted leading-relaxed mt-4">
            Hãy giữ lại email đó: đấy là link tải riêng của bạn, dùng lại được bất cứ lúc nào.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap mt-8">
            <Link href="/kho" className="px-6 py-3 rounded-md text-sm font-semibold border border-border text-text-primary no-underline hover:border-gold/30 hover:text-gold transition-colors">
              Về Kho EA
            </Link>
            <a href={SUPPORT_TG} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-md text-sm font-semibold bg-gold-bright text-[#060609] no-underline inline-flex items-center gap-1.5 transition-transform hover:scale-[1.03]">
              Chưa nhận được email? <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
