// Public EA storefront (/kho). Guest checkout: pick an EA → pay in crypto via
// Cryptomus → the download link arrives by e-mail. One-off purchase, files kept
// forever, no license key for these EAs.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Home, Mail, ShieldCheck } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { BuyButton } from "./buy-button";

export const metadata: Metadata = {
  title: "Kho EA — mua EA vàng bản quyền | Dralvo",
  description:
    "Kho EA giao dịch vàng XAUUSD cho MetaTrader. Mua một lần, dùng vĩnh viễn, nhận link tải qua email. Thanh toán bằng crypto.",
};

export const dynamic = "force-dynamic";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif";
const SUPPORT_TG = "https://t.me/dralvoea";

interface StoreEa {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
  price_usd: number | string;
  guide_storage_path: string | null;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function KhoStorePage() {
  let eas: StoreEa[] = [];
  try {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data } = await admin
        .from("vault_eas")
        .select("id, name, version, description, price_usd, guide_storage_path")
        .eq("enabled", true)
        .eq("for_sale", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      eas = (data as StoreEa[]) ?? [];
    }
  } catch {
    /* table/column may not exist yet — render an empty store */
  }

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" /><div className="h1" /><div className="h2" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-deep/85 backdrop-blur-xl">
        <div className="max-w-[1100px] mx-auto px-5 h-14 flex items-center justify-between gap-3">
          <BrandLink logoSize={28} wordmarkClassName="text-base" />
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-text-secondary hover:text-gold border border-border no-underline transition-colors">
              <Home size={14} /> Trang chủ
            </Link>
            <a href={SUPPORT_TG} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold bg-gold-bright text-[#060609] no-underline transition-transform hover:scale-[1.03]">
              Hỗ trợ <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </header>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative pt-14 pb-10 px-5 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[700px] h-[520px] -top-60 -right-32" />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium border border-border text-text-muted mb-5" style={{ background: "rgba(26,26,42,0.4)" }}>
              Kho EA
            </div>
            <h1 className="text-4xl sm:text-5xl font-normal leading-[1.08] tracking-[-0.015em] mb-4" style={{ fontFamily: SERIF }}>
              Kho EA vàng — <span className="text-gold-bright">mua 1 lần, dùng vĩnh viễn</span>
            </h1>
            <p className="text-base text-text-secondary leading-relaxed max-w-[640px]">
              Bộ EA giao dịch XAUUSD cho MetaTrader, tuyển chọn sẵn. Thanh toán bằng crypto, link tải gửi thẳng vào email của bạn.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { Icon: BadgeCheck, t: "Mua 1 lần — không phí định kỳ" },
                { Icon: Mail, t: "Link tải qua email" },
                { Icon: ShieldCheck, t: "Thanh toán crypto (Cryptomus)" },
              ].map(({ Icon, t }) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-border text-text-secondary" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <Icon size={13} className="text-gold" /> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="px-5 pb-20">
          <div className="max-w-[1100px] mx-auto">
            {eas.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card/60 p-10 text-center">
                <p className="text-sm text-text-muted">
                  Kho đang được cập nhật. Nhắn{" "}
                  <a href={SUPPORT_TG} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@dralvoea</a>{" "}
                  để được báo khi có EA mới.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eas.map((ea) => {
                  const price = Number(ea.price_usd);
                  return (
                    <article key={ea.id} className="relative overflow-hidden rounded-xl border border-border flex flex-col min-h-[260px]">
                      <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(/ea-art/${slugify(ea.name)}.svg)` }} />
                      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#070a0e] via-[#070a0e]/85 to-[#070a0e]/40" />

                      <div className="relative p-5 flex flex-col h-full justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="text-xl font-bold text-white tracking-tight truncate">{ea.name}</h2>
                              {ea.version && <span className="text-[11px] text-white/55 font-mono">v{ea.version}</span>}
                            </div>
                            <span className="shrink-0 font-mono text-lg font-bold text-gold-bright">${price}</span>
                          </div>
                          <p className={`text-[12px] mt-2 line-clamp-3 ${ea.description ? "text-white/75" : "text-white/45 italic"}`}>
                            {ea.description ?? "EA giao dịch vàng tự động cho MetaTrader."}
                          </p>
                        </div>

                        <BuyButton eaId={ea.id} eaName={ea.name} price={price} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] text-text-muted mt-8 max-w-[720px] leading-relaxed">
              Dralvo cung cấp công cụ giao dịch, không phải lời khuyên tài chính. Kết quả trong quá khứ không bảo đảm
              kết quả tương lai. Giao dịch XAUUSD có đòn bẩy và rủi ro mất vốn — hãy chạy demo trước khi dùng tiền thật.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
