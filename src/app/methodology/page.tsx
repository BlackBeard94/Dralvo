"use client";

import Link from "next/link";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import { PRODUCT_COPY } from "@/lib/i18n";

const copy = {
  vi: {
    badge: "Phương pháp công khai",
    title: "Bằng chứng trước, diễn giải sau.",
    intro: "Dralvo chỉ xây luận điểm từ dữ liệu có nguồn, thời điểm quan sát và giới hạn rõ ràng. Dữ liệu thiếu hoặc quá hạn không được thay bằng giá trị mô phỏng.",
    home: "Trang chủ",
    signIn: "Đăng nhập",
    sourcesTitle: "Nguồn dữ liệu đang sử dụng",
    sourcesIntro: "Năm driver production bao phủ giá, vĩ mô, vị thế, tồn kho và lượng vàng ETF. Mỗi nguồn giữ nguyên nhịp công bố thực tế.",
    cadence: "Nhịp nguồn",
    question: "Câu hỏi quyết định",
    limitation: "Giới hạn",
    source: "Mở nguồn",
    processTitle: "Từ dữ liệu đến luận điểm",
    process: [
      ["01", "Thu thập", "Lấy dữ liệu từ nguồn chính thức hoặc nhà cung cấp được cấu hình, kèm thời điểm quan sát và nhận dữ liệu."],
      ["02", "Xác minh", "Kiểm tra trường bắt buộc, độ mới, tính hợp lệ và loại bỏ quan sát thiếu hoặc hỏng."],
      ["03", "Đánh giá", "Áp dụng quy tắc xác định trước cho từng driver. Không một driver riêng lẻ nào trở thành tín hiệu mua hoặc bán."],
      ["04", "Tổng hợp", "Kết hợp trạng thái ủng hộ, bất lợi, trung lập và thiếu dữ liệu thành luận điểm có thể truy xuất."],
      ["05", "Theo dõi", "Ghi lại thay đổi và đánh giá lại khi nguồn liên quan có quan sát mới."],
    ],
    limitsTitle: "Dralvo không kết luận điều gì",
    limits: [
      "Không dự đoán chắc chắn hướng đi tiếp theo của XAUUSD.",
      "Không gọi dữ liệu chậm theo ngày hoặc tuần là dữ liệu thời gian thực.",
      "Không coi tương quan hay một thay đổi tồn kho đơn lẻ là quan hệ nhân quả.",
      "Không tự tạo dữ liệu thay thế khi nguồn không khả dụng.",
      "Không cung cấp tín hiệu mua bán, thực thi lệnh hoặc tư vấn tài chính.",
    ],
    ctaTitle: "Kiểm tra luận điểm cùng đường dẫn nguồn.",
    ctaBody: "Bắt đầu miễn phí để xem trạng thái hiện tại, độ mới của dữ liệu và bằng chứng đứng sau mỗi kết luận.",
  },
  en: {
    badge: "Public methodology",
    title: "Evidence first. Interpretation second.",
    intro: "Dralvo builds a thesis only from data with a named source, observation time, and explicit limitations. Missing or stale evidence is never replaced with simulated values.",
    home: "Home", signIn: "Sign in",
    sourcesTitle: "Sources in production",
    sourcesIntro: "Five production drivers cover price, macro pressure, positioning, inventory, and ETF holdings. Each source keeps its honest publication cadence.",
    cadence: "Source cadence", question: "Decision question", limitation: "Limitation", source: "Open source",
    processTitle: "From observation to thesis",
    process: [
      ["01", "Collect", "Retrieve data from an official source or configured provider with observation and retrieval timestamps."],
      ["02", "Verify", "Check required fields, freshness, and validity; reject incomplete or malformed observations."],
      ["03", "Evaluate", "Apply predefined rules to each driver. No individual driver becomes a buy or sell signal."],
      ["04", "Synthesize", "Combine supportive, adverse, neutral, and missing states into a traceable thesis."],
      ["05", "Monitor", "Record changes and evaluate again when a relevant source publishes a new observation."],
    ],
    limitsTitle: "What Dralvo does not conclude",
    limits: [
      "It does not predict the next XAUUSD move with certainty.",
      "It does not label daily or weekly source data as real time.",
      "It does not treat correlation or one inventory change as causation.",
      "It does not generate replacement data when a source is unavailable.",
      "It does not provide buy or sell signals, execution, or financial advice.",
    ],
    ctaTitle: "Inspect the thesis with its source trail.",
    ctaBody: "Start free to see the current state, data freshness, and evidence behind each conclusion.",
  },
  "pt-BR": {
    badge: "Metodologia pública",
    title: "Evidência primeiro. Interpretação depois.",
    intro: "A Dralvo cria uma tese apenas com dados que tenham fonte, horário de observação e limitações explícitas. Evidências ausentes ou desatualizadas nunca são substituídas por valores simulados.",
    home: "Início", signIn: "Entrar",
    sourcesTitle: "Fontes em produção",
    sourcesIntro: "Cinco drivers de produção cobrem preço, pressão macro, posicionamento, estoque e reservas de ETF. Cada fonte mantém sua cadência real de publicação.",
    cadence: "Cadência da fonte", question: "Pergunta de decisão", limitation: "Limitação", source: "Abrir fonte",
    processTitle: "Da observação à tese",
    process: [
      ["01", "Coletar", "Obter dados de uma fonte oficial ou provedor configurado com horários de observação e coleta."],
      ["02", "Verificar", "Validar campos obrigatórios, atualidade e integridade; rejeitar observações incompletas ou inválidas."],
      ["03", "Avaliar", "Aplicar regras predefinidas a cada driver. Nenhum driver isolado vira sinal de compra ou venda."],
      ["04", "Sintetizar", "Combinar estados favoráveis, adversos, neutros e ausentes em uma tese rastreável."],
      ["05", "Monitorar", "Registrar mudanças e reavaliar quando uma fonte relevante publicar nova observação."],
    ],
    limitsTitle: "O que a Dralvo não conclui",
    limits: [
      "Não prevê com certeza o próximo movimento do XAUUSD.",
      "Não chama dados diários ou semanais de tempo real.",
      "Não trata correlação ou uma mudança isolada de estoque como causalidade.",
      "Não gera dados substitutos quando uma fonte está indisponível.",
      "Não fornece sinais de compra e venda, execução ou aconselhamento financeiro.",
    ],
    ctaTitle: "Inspecione a tese com a trilha de fontes.",
    ctaBody: "Comece grátis para ver o estado atual, a atualidade dos dados e as evidências por trás de cada conclusão.",
  },
} as const;

export default function MethodologyPage() {
  const { locale } = useLocale();
  const pageCopy = copy[locale as keyof typeof copy] ?? copy.en;
  const productCopy = PRODUCT_COPY[locale];

  return (
    <div className="min-h-screen overflow-x-hidden bg-deep text-text-primary">
      <div className="gold-veins" aria-hidden="true">
        <div className="v1" /><div className="v2" /><div className="v3" />
        <div className="h1" /><div className="h2" />
      </div>

      <nav className="sticky top-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(212,168,67,0.04)]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <BrandLink />
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline">{pageCopy.home}</Link>
            <Link href="/login" className="hidden md:inline text-[13px] tracking-[0.03em] text-text-muted hover:text-gold transition-colors no-underline">{pageCopy.signIn}</Link>
            <Link href="/signup" className="rounded-md bg-gold-action px-4 py-2 text-[13px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:bg-gold-actionHover hover:scale-[1.03]">{productCopy.primaryCta}</Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <section className="relative pt-24 pb-12 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[600px] h-[600px] -right-40 -top-40 opacity-40" />
          <div className="relative z-10 mx-auto max-w-[900px] px-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium border border-border text-text-muted mb-8" style={{ background: "rgba(26,26,42,0.4)" }}>
              {pageCopy.badge}
            </div>
            <h1 className="max-w-[800px] text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.06] tracking-[-0.015em] text-balance mb-5" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>
              {pageCopy.title}
            </h1>
            <p className="max-w-[720px] text-lg leading-relaxed text-text-secondary">{pageCopy.intro}</p>
          </div>
        </section>

        <section id="sources" className="scroll-mt-20 py-20 lg:py-28 bg-surface">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="mb-14">
              <h2 className="text-3xl sm:text-4xl font-normal leading-[1.1] tracking-[-0.015em] mb-4" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{pageCopy.sourcesTitle}</h2>
              <p className="text-text-secondary leading-relaxed max-w-[640px]">{pageCopy.sourcesIntro}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {DRIVER_SOURCE_REGISTRY.map((driver, index) => (
                <article key={driver.driverKey} className="rounded-xl border border-border bg-card p-6 hover:border-gold/20 transition-all duration-300">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-xs text-gold">0{index + 1}</div>
                      <h3 className="mt-2 text-xl text-text-primary" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{driver.label}</h3>
                    </div>
                    <span className="rounded-full border border-green/20 bg-green/5 px-3 py-1 text-[10px] uppercase tracking-wider text-green font-medium">Production</span>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="mb-0.5 text-[10px] uppercase tracking-wider text-text-muted">{pageCopy.cadence}</dt><dd className="text-text-secondary">{driver.cadence}</dd></div>
                    <div><dt className="mb-0.5 text-[10px] uppercase tracking-wider text-text-muted">{pageCopy.question}</dt><dd className="text-text-secondary">{driver.decisionQuestion}</dd></div>
                    <div><dt className="mb-0.5 text-[10px] uppercase tracking-wider text-text-muted">{pageCopy.limitation}</dt><dd className="text-text-secondary">{driver.limitations}</dd></div>
                  </dl>
                  <a href={driver.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-medium text-gold no-underline hover:text-gold-bright transition-colors">{pageCopy.source} →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="scroll-mt-20 py-20 lg:py-28">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="text-3xl sm:text-4xl font-normal leading-[1.1] tracking-[-0.015em] mb-12" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{pageCopy.processTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {pageCopy.process.map(([number, title, body]) => (
                <article key={number} className="rounded-xl border border-border bg-card p-6 hover:border-gold/20 transition-all duration-300">
                  <div className="font-mono text-xs text-gold font-bold mb-4">{number}</div>
                  <h3 className="font-semibold text-text-primary text-[15px] mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="limitations" className="scroll-mt-20 py-20 lg:py-28 bg-surface">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="text-3xl sm:text-4xl font-normal leading-[1.1] tracking-[-0.015em] mb-10" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{pageCopy.limitsTitle}</h2>
            <div className="space-y-3">
              {pageCopy.limits.map((item) => (
                <div key={item} className="flex gap-4 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-text-secondary hover:border-gold/20 transition-all">
                  <span className="text-gold shrink-0 mt-0.5">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 lg:py-32 overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2 opacity-30" />
          <div className="mx-auto max-w-[640px] px-6 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-normal leading-[1.1] tracking-[-0.015em] mb-4" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', 'Noto Serif', serif" }}>{pageCopy.ctaTitle}</h2>
            <p className="text-text-secondary mb-8 leading-relaxed">{pageCopy.ctaBody}</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-[15px] font-semibold bg-gold-bright text-[#060609] no-underline transition-all duration-200 hover:scale-[1.03]">{productCopy.primaryCta}</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/50">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <BrandLink logoSize={28} wordmarkClassName="text-base" />
            <div className="flex flex-wrap items-center gap-5 text-xs text-text-secondary">
              <Link href="/methodology" className="hover:text-gold transition-colors no-underline">Phương pháp</Link>
              <Link href="/pricing" className="hover:text-gold transition-colors no-underline">Bảng giá</Link>
              <Link href="/privacy" className="hover:text-gold transition-colors no-underline">Bảo mật</Link>
              <Link href="/terms" className="hover:text-gold transition-colors no-underline">Điều khoản</Link>
              <Link href="/disclaimer" className="hover:text-gold transition-colors no-underline">Miễn trừ trách nhiệm</Link>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-text-muted">© 2026 Dralvo. Không phải lời khuyên đầu tư.</p>
            <p className="text-[11px] text-text-muted">Past performance ≠ future results.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
