"use client";

import Link from "next/link";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SiteFooter } from "@/components/shared/site-footer";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import { PRODUCT_COPY } from "@/lib/i18n";

const copy = {
  vi: {
    badge: "Phương pháp công khai",
    title: "Bằng chứng trước, diễn giải sau.",
    intro:
      "Dralvo chỉ xây luận điểm từ dữ liệu có nguồn, thời điểm quan sát và giới hạn rõ ràng. Dữ liệu thiếu hoặc quá hạn không được thay bằng giá trị mô phỏng.",
    home: "Trang chủ",
    signIn: "Đăng nhập",
    sourcesTitle: "Nguồn dữ liệu đang sử dụng",
    sourcesIntro:
      "Năm driver production bao phủ giá, vĩ mô, vị thế, tồn kho và lượng vàng ETF. Mỗi nguồn giữ nguyên nhịp công bố thực tế.",
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
    ctaBody:
      "Bắt đầu miễn phí để xem trạng thái hiện tại, độ mới của dữ liệu và bằng chứng đứng sau mỗi kết luận.",
  },
  en: {
    badge: "Public methodology",
    title: "Evidence first. Interpretation second.",
    intro:
      "Dralvo builds a thesis only from data with a named source, observation time, and explicit limitations. Missing or stale evidence is never replaced with simulated values.",
    home: "Home",
    signIn: "Sign in",
    sourcesTitle: "Sources in production",
    sourcesIntro:
      "Five production drivers cover price, macro pressure, positioning, inventory, and ETF holdings. Each source keeps its honest publication cadence.",
    cadence: "Source cadence",
    question: "Decision question",
    limitation: "Limitation",
    source: "Open source",
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
    ctaBody:
      "Start free to see the current state, data freshness, and evidence behind each conclusion.",
  },
  "pt-BR": {
    badge: "Metodologia pública",
    title: "Evidência primeiro. Interpretação depois.",
    intro:
      "A Dralvo cria uma tese apenas com dados que tenham fonte, horário de observação e limitações explícitas. Evidências ausentes ou desatualizadas nunca são substituídas por valores simulados.",
    home: "Início",
    signIn: "Entrar",
    sourcesTitle: "Fontes em produção",
    sourcesIntro:
      "Cinco drivers de produção cobrem preço, pressão macro, posicionamento, estoque e reservas de ETF. Cada fonte mantém sua cadência real de publicação.",
    cadence: "Cadência da fonte",
    question: "Pergunta de decisão",
    limitation: "Limitação",
    source: "Abrir fonte",
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
    ctaBody:
      "Comece grátis para ver o estado atual, a atualidade dos dados e as evidências por trás de cada conclusão.",
  },
} as const;

export default function MethodologyPage() {
  const { locale } = useLocale();
  const pageCopy = copy[locale];
  const productCopy = PRODUCT_COPY[locale];

  return (
    <div className="min-h-screen overflow-x-hidden bg-deep text-text-primary">
      <nav className="sticky top-0 z-50 border-b border-border bg-deep/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <BrandLink />
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-sm text-text-secondary no-underline transition-colors hover:text-gold sm:block">
              {pageCopy.home}
            </Link>
            <Link href="/login" className="hidden text-sm text-text-secondary no-underline transition-colors hover:text-gold md:block">
              {pageCopy.signIn}
            </Link>
            <Link href="/signup" className="rounded-lg bg-gold-action px-4 py-2 text-sm font-semibold text-[#060609] no-underline transition-colors hover:bg-gold-actionHover">
              {productCopy.primaryCta}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-border py-24">
          <GridPattern />
          <GlowOrb className="h-[600px] w-[600px] -right-48 -top-48" />
          <div className="relative z-10 mx-auto max-w-[980px] px-6">
            <div className="mb-7 inline-flex rounded-full border border-border-gold bg-gold/5 px-4 py-1.5 text-[13px] uppercase tracking-[0.15em] text-gold">
              {pageCopy.badge}
            </div>
            <h1 className="max-w-[800px] font-display text-[clamp(44px,7vw,76px)] font-normal leading-[1.04] tracking-[-0.03em]">
              {pageCopy.title}
            </h1>
            <p className="mt-7 max-w-[720px] text-lg leading-relaxed text-text-secondary">
              {pageCopy.intro}
            </p>
          </div>
        </section>

        <section id="sources" className="scroll-mt-20 border-b border-border py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="mb-12 max-w-[720px]">
              <h2 className="font-display text-4xl">{pageCopy.sourcesTitle}</h2>
              <p className="mt-4 leading-relaxed text-text-secondary">{pageCopy.sourcesIntro}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {DRIVER_SOURCE_REGISTRY.map((driver, index) => (
                <article key={driver.driverKey} className="rounded-2xl border border-border bg-surface p-7">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-[13px] text-gold">0{index + 1}</div>
                      <h3 className="mt-2 font-display text-2xl">{driver.label}</h3>
                    </div>
                    <span className="rounded-full border border-green/30 bg-green/10 px-3 py-1 text-[12px] uppercase tracking-wider text-green">
                      Production
                    </span>
                  </div>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="mb-1 text-[13px] uppercase tracking-wider text-text-muted">{pageCopy.cadence}</dt>
                      <dd className="text-text-secondary">{driver.cadence}</dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[13px] uppercase tracking-wider text-text-muted">{pageCopy.question}</dt>
                      <dd className="text-text-secondary">{driver.decisionQuestion}</dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[13px] uppercase tracking-wider text-text-muted">{pageCopy.limitation}</dt>
                      <dd className="text-text-secondary">{driver.limitations}</dd>
                    </div>
                  </dl>
                  <a href={driver.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex text-sm font-semibold text-gold no-underline hover:text-gold-bright">
                    {pageCopy.source} -&gt;
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="scroll-mt-20 border-b border-border py-24">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="mb-12 font-display text-4xl">{pageCopy.processTitle}</h2>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-5">
              {pageCopy.process.map(([number, title, body]) => (
                <article key={number} className="bg-surface p-6">
                  <div className="font-mono text-xs text-gold">{number}</div>
                  <h3 className="mt-5 font-display text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="limitations" className="scroll-mt-20 py-24">
          <div className="mx-auto grid max-w-[1100px] gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="font-display text-4xl">{pageCopy.limitsTitle}</h2>
            <ul className="space-y-4">
              {pageCopy.limits.map((item) => (
                <li key={item} className="flex gap-4 rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-text-secondary">
                  <span className="text-gold">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-[760px] px-6 text-center">
            <h2 className="font-display text-4xl">{pageCopy.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-[620px] text-text-secondary">{pageCopy.ctaBody}</p>
            <Link href="/signup" className="mt-8 inline-flex rounded-lg bg-gold-action px-7 py-3.5 text-sm font-semibold text-[#060609] no-underline transition-colors hover:bg-gold-actionHover">
              {productCopy.primaryCta}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
