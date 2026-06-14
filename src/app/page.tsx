"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { ChartPreview } from "@/components/dashboard/chart-preview";
import { DashboardMockup } from "@/components/dashboard/dashboard-mockup";
import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SiteFooter } from "@/components/shared/site-footer";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { PRODUCT_COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const homeCopy = {
  vi: {
    heroTitle: "Nhìn thấy thị trường vàng phía sau biến động giá.",
    viewDemo: "Xem phương pháp",
    signIn: "Đăng nhập",
    createAccount: "Tạo tài khoản",
    menu: "Mở menu",
    navLinks: [
      { label: "Tính năng", href: "#features" },
      { label: "Cách hoạt động", href: "#how-it-works" },
      { label: "Bảng giá", href: "#pricing" },
      { label: "Phương pháp", href: "/methodology" },
    ],
    featuresTitle: "Hiểu luận điểm vàng trước khi hành động",
    featuresSubtitle:
      "Bằng chứng đã xác minh, mâu thuẫn rõ ràng và điều kiện thay đổi có thể theo dõi trong một workspace tập trung.",
    docsTitle: "Xây cho trader vàng, không phải nền tảng đại trà",
    docsSubtitle:
      "Mỗi tính năng trong Dralvo xoay quanh một tài sản và một mục tiêu: giúp trader XAUUSD có góc nhìn rõ hơn trước mỗi quyết định.",
    dashboardTitle: "Một luận điểm. Mọi driver đều truy xuất được.",
    dashboardSubtitle:
      "Bắt đầu từ kết luận, kiểm tra bằng chứng ủng hộ và phản biện, rồi xem điều kiện nào sẽ thay đổi góc nhìn.",
    howTitle: "Từ dữ liệu vàng rời rạc thành một bề mặt quyết định",
    howSubtitle:
      "Dralvo không giao dịch thay người dùng. Dralvo tổ chức bối cảnh để người dùng tự ra quyết định với góc nhìn rõ hơn.",
    faqTitle: "Câu hỏi trader thường hỏi trước khi tham gia",
    faqSubtitle: "Câu trả lời rõ ràng về Dralvo. Không thổi phồng marketing.",
    pricingTitle: "Một gói Free. Một gói Pro. Không bất ngờ.",
    pricingSubtitle:
      "Free cung cấp ngữ cảnh giá cốt lõi và góc nhìn bằng chứng giới hạn. Pro mở toàn bộ workflow luận điểm, driver có nguồn, cảnh báo điều kiện và công cụ xuất dữ liệu.",
    ctaTitle: "Sẵn sàng đào sâu vào thị trường vàng?",
    ctaSubtitle:
      "Tạo tài khoản miễn phí để dùng dashboard cốt lõi, hoặc bắt đầu dùng thử Pro 3 ngày khi bạn cần bộ công cụ đầy đủ.",
    createFree: "Tạo tài khoản miễn phí",
    startTrial: "Dùng thử Pro 3 ngày",
    workflowTitle: "Dralvo - Quy trình bằng chứng",
    todayThesis: "LUẬN ĐIỂM HÔM NAY",
    illustrative:
      "Minh họa giao diện. Giá trị production yêu cầu pipeline nguồn đã xác minh.",
    pricingCtas: { free: "Bắt đầu Free", pro: "Xem Pro" },
    docRead: "Đọc thêm ->",
    docOpen: "Mở bản xem trước ->",
    features: [
      ["01", "Luận điểm vàng có nguồn", "Một trạng thái có thể giải thích từ giá, lợi suất thực, vị thế CFTC, tồn kho COMEX và lượng vàng GLD."],
      ["02", "Bằng chứng trước diễn giải", "Mỗi driver hiển thị nguồn, ngày quan sát, độ mới, phương pháp và giới hạn trước khi Dralvo diễn giải."],
      ["03", "Theo dõi thay đổi luận điểm", "Theo dõi điều kiện đa driver và nhận giải thích khi bằng chứng thay đổi đáng kể."],
      ["04", "Pipeline dữ liệu đã xác minh", "Nguồn CFTC, CME, SPDR và FRED được kết hợp với ngữ cảnh giá XAUUSD. Thiếu dữ liệu thì hiển thị là thiếu."],
      ["05", "Ngôn ngữ an toàn cho quyết định", "Dralvo tóm tắt bối cảnh. Không đặt lệnh, không hứa lợi nhuận và không tư vấn tài chính."],
      ["06", "Truy cập Free và Pro", "Khám phá bằng chứng cốt lõi miễn phí. Pro mở toàn bộ luận điểm, cảnh báo, xuất dữ liệu, Stripe và VietQR."],
    ],
    docs: [
      ["Dralvo theo dõi gì", "/methodology#sources", "Ngữ cảnh giá XAUUSD, lợi suất thực, vị thế CFTC, tồn kho COMEX và lượng vàng GLD đã xác minh."],
      ["Cách hệ thống hoạt động", "/methodology#process", "Bằng chứng được ingest, chuẩn hóa, đánh giá và hiển thị cùng metadata nguồn và độ mới."],
      ["Giới hạn của dữ liệu", "/methodology#limitations", "Xem nhịp cập nhật, phạm vi và những điều mỗi nguồn dữ liệu không thể kết luận."],
    ],
    steps: [
      ["Xác minh", "Thu thập dữ liệu nguồn chính thức hoặc được cấp phép theo nhịp thật, không tạo giá trị fallback giả."],
      ["Đánh giá", "Áp dụng quy tắc xác định đã công bố cho các driver độc lập và loại bằng chứng thiếu hoặc quá hạn."],
      ["Theo dõi", "Hiển thị luận điểm, mâu thuẫn, đường dẫn nguồn và điều kiện rõ ràng có thể thay đổi luận điểm."],
    ],
    faq: [
      ["Dralvo là gì?", "Dralvo là Gold Decision Intelligence. Sản phẩm biến ngữ cảnh giá XAUUSD, lợi suất thực, vị thế CFTC, tồn kho COMEX và lượng vàng GLD thành luận điểm có thể giải thích."],
      ["Dralvo có miễn phí không?", "Có. Tài khoản Free có ngữ cảnh giá và bằng chứng cốt lõi. Pro mở workflow luận điểm đầy đủ, cảnh báo, xuất dữ liệu và các bề mặt nghiên cứu bổ sung."],
      ["Dralvo có đưa tín hiệu mua bán không?", "Không. Dralvo tóm tắt bối cảnh thị trường để bạn tự quyết định. Sản phẩm không đặt lệnh, không phát tín hiệu mua/bán và không tư vấn tài chính."],
      ["Dralvo khác TradingView thế nào?", "TradingView là nền tảng biểu đồ tổng quát. Dralvo không thay thế nó. Dralvo kết hợp bằng chứng chuyên sâu về vàng thành luận điểm có thể giải thích và chỉ ra điều kiện thay đổi luận điểm."],
    ],
    pricing: [
      ["Free", "$0", "mãi mãi", "Có sẵn", ["Ngữ cảnh giá XAUUSD cốt lõi", "Snapshot bằng chứng giới hạn", "Xem trước luận điểm hôm nay", "Nhãn nguồn và độ mới", "Không cần thẻ"]],
      ["Pro", "$19", "/tháng", "3 ngày dùng thử", ["Luận điểm vàng đầy đủ có nguồn", "Nhịp cập nhật đã xác minh", "Bằng chứng CFTC, COMEX, GLD, TIPS và XAUUSD", "Cảnh báo tùy chỉnh", "Xuất CSV", "Stripe và VietQR"]],
    ],
    workflowRows: [
      ["Lợi suất thực", "Ủng hộ", "text-green"],
      ["Vị thế CFTC", "Ủng hộ", "text-green"],
      ["Lượng vàng GLD", "Bất lợi", "text-red"],
      ["Tồn kho COMEX", "Trung lập", "text-gold"],
    ],
  },
  en: {
    heroTitle: "See the gold market behind the price.",
    viewDemo: "View Methodology",
    signIn: "Sign in",
    createAccount: "Create account",
    menu: "Toggle menu",
    navLinks: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Methodology", href: "/methodology" },
    ],
    featuresTitle: "Understand the gold thesis before acting",
    featuresSubtitle:
      "Verified evidence, explicit contradictions, and monitorable change conditions in one focused workspace.",
    docsTitle: "Built for gold traders, not generalists",
    docsSubtitle:
      "Every feature in Dralvo is designed around one asset and one goal: giving XAUUSD traders a clearer view before every decision.",
    dashboardTitle: "One thesis. Every driver traceable.",
    dashboardSubtitle:
      "Start with the conclusion, inspect supporting and contradicting evidence, then see the conditions that would change the view.",
    howTitle: "From scattered gold data to one decision surface",
    howSubtitle:
      "Dralvo does not trade for users. It organizes context so users can make their own decisions with a clearer view.",
    faqTitle: "Questions traders ask before joining",
    faqSubtitle: "Straight answers about Dralvo. No marketing fluff.",
    pricingTitle: "One free tier. One Pro tier. No surprises.",
    pricingSubtitle:
      "Free provides the core price context and a limited evidence view. Pro unlocks the complete thesis workflow, source-backed drivers, condition alerts, and export tools.",
    ctaTitle: "Ready to Drill Into Gold?",
    ctaSubtitle:
      "Create a free account to use the core dashboard, or start a 3-day Pro trial when you are ready for the full toolkit.",
    createFree: "Create Free Account",
    startTrial: "Start 3-Day Pro Trial",
    workflowTitle: "Dralvo - Evidence Workflow",
    todayThesis: "TODAY'S THESIS",
    illustrative:
      "Illustrative preview. Production values require verified source ingestion.",
    pricingCtas: { free: "Start Free", pro: "View Pro" },
    docRead: "Read more ->",
    docOpen: "Open preview ->",
    features: [
      ["01", "Source-Backed Gold Thesis", "One explainable state built from price, real yields, CFTC positioning, COMEX inventory, and GLD holdings."],
      ["02", "Evidence Before Interpretation", "Every driver shows its source, observation date, freshness, methodology, and limitations before Dralvo interprets it."],
      ["03", "Thesis Change Monitoring", "Monitor multi-driver conditions and receive an explanation when the evidence materially changes."],
      ["04", "Verified Data Pipelines", "Official CFTC, CME, SPDR, and FRED sources are combined with XAUUSD price context. Missing data stays missing."],
      ["05", "Decision-Safe Language", "Dralvo summarizes context. It does not place trades, promise returns, or provide financial advice."],
      ["06", "Free And Pro Access", "Explore core evidence for free. Pro unlocks the complete thesis workflow, alerts, exports, Stripe, and VietQR."],
    ],
    docs: [
      ["What We Track", "/methodology#sources", "Verified XAUUSD price context, real yields, CFTC positioning, COMEX inventory, and GLD holdings."],
      ["How It Works", "/methodology#process", "Evidence is ingested, normalized, evaluated, and surfaced with source and freshness metadata."],
      ["Data Limitations", "/methodology#limitations", "Review the cadence, scope, and conclusions that each source cannot support on its own."],
    ],
    steps: [
      ["Verify", "Collect official and licensed source data at its honest cadence, with no generated fallback values."],
      ["Evaluate", "Apply deterministic, published rules to independent drivers and exclude missing or stale evidence."],
      ["Monitor", "Show the thesis, contradictions, source trail, and explicit conditions that would change it."],
    ],
    faq: [
      ["What is Dralvo?", "Dralvo is Gold Decision Intelligence. It turns verified XAUUSD price context, real yields, CFTC positioning, COMEX inventory, and GLD holdings into an explainable thesis."],
      ["Is Dralvo free?", "Yes. A Free account provides core price and evidence access. Pro unlocks the complete thesis workflow, alerts, exports, and additional research surfaces."],
      ["Does Dralvo give trading signals or tell me when to buy?", "No. Dralvo summarizes context so you can make your own decisions. It does not place trades, issue buy/sell signals, or provide financial advice."],
      ["How is Dralvo different from TradingView?", "TradingView is a general-purpose charting platform. Dralvo does not replace it. Dralvo combines specialist gold evidence into an explainable thesis and tells you what would change it."],
    ],
    pricing: [
      ["Free", "$0", "forever", "Available now", ["Core XAUUSD price context", "Limited verified evidence snapshots", "Today thesis preview", "Source and freshness labels", "No card required"]],
      ["Pro", "$19", "/month", "3-day trial", ["Complete source-backed gold thesis", "Verified refresh cadence for every source", "CFTC, COMEX, GLD, TIPS, and XAUUSD evidence", "Custom condition alerts and notifications", "CSV export", "Stripe and VietQR"]],
    ],
    workflowRows: [
      ["Real yields", "Supportive", "text-green"],
      ["CFTC positioning", "Supportive", "text-green"],
      ["GLD holdings", "Adverse", "text-red"],
      ["COMEX inventory", "Neutral", "text-gold"],
    ],
  },
  "pt-BR": {
    heroTitle: "Veja o mercado de ouro por trás do preço.",
    viewDemo: "Ver metodologia",
    signIn: "Entrar",
    createAccount: "Criar conta",
    menu: "Abrir menu",
    navLinks: [
      { label: "Recursos", href: "#features" },
      { label: "Como funciona", href: "#how-it-works" },
      { label: "Preços", href: "#pricing" },
      { label: "Metodologia", href: "/methodology" },
    ],
    featuresTitle: "Entenda a tese do ouro antes de agir",
    featuresSubtitle:
      "Evidências verificadas, contradições explícitas e condições de mudança monitoráveis em um workspace focado.",
    docsTitle: "Feito para traders de ouro, não para generalistas",
    docsSubtitle:
      "Cada recurso da Dralvo gira em torno de um ativo e um objetivo: dar ao trader de XAUUSD uma visão mais clara antes de decidir.",
    dashboardTitle: "Uma tese. Todo driver rastreável.",
    dashboardSubtitle:
      "Comece pela conclusão, inspecione evidências favoráveis e contrárias, e veja as condições que mudariam a visão.",
    howTitle: "De dados dispersos do ouro para uma superfície de decisão",
    howSubtitle:
      "A Dralvo não negocia pelos usuários. Ela organiza contexto para que cada usuário decida com mais clareza.",
    faqTitle: "Perguntas que traders fazem antes de entrar",
    faqSubtitle: "Respostas diretas sobre a Dralvo. Sem exagero de marketing.",
    pricingTitle: "Um plano Free. Um plano Pro. Sem surpresas.",
    pricingSubtitle:
      "Free oferece contexto central de preço e visão limitada de evidências. Pro libera a tese completa, drivers com fonte, alertas condicionais e exportação.",
    ctaTitle: "Pronto para investigar o ouro?",
    ctaSubtitle:
      "Crie uma conta gratuita para usar o painel central ou inicie um teste Pro de 3 dias quando precisar do conjunto completo.",
    createFree: "Criar conta grátis",
    startTrial: "Iniciar teste Pro",
    workflowTitle: "Dralvo - Fluxo de evidências",
    todayThesis: "TESE DE HOJE",
    illustrative:
      "Prévia ilustrativa. Valores de produção exigem ingestão de fontes verificadas.",
    pricingCtas: { free: "Começar Free", pro: "Ver Pro" },
    docRead: "Ler mais ->",
    docOpen: "Abrir prévia ->",
    features: [
      ["01", "Tese de ouro com fontes", "Um estado explicável criado a partir de preço, juros reais, posicionamento CFTC, estoque COMEX e reservas GLD."],
      ["02", "Evidência antes da interpretação", "Cada driver mostra fonte, data de observação, frescor, metodologia e limitações antes da interpretação."],
      ["03", "Monitoramento da tese", "Monitore condições de múltiplos drivers e receba uma explicação quando a evidência mudar de forma relevante."],
      ["04", "Pipelines verificados", "Fontes CFTC, CME, SPDR e FRED são combinadas com contexto XAUUSD. Dados ausentes continuam ausentes."],
      ["05", "Linguagem segura para decisão", "A Dralvo resume contexto. Não executa ordens, não promete retorno e não presta aconselhamento financeiro."],
      ["06", "Acesso Free e Pro", "Explore evidências centrais grátis. Pro libera tese completa, alertas, exportações, Stripe e VietQR."],
    ],
    docs: [
      ["O que acompanhamos", "/methodology#sources", "Contexto XAUUSD, juros reais, posicionamento CFTC, estoque COMEX e reservas GLD verificados."],
      ["Como funciona", "/methodology#process", "Evidências são ingeridas, normalizadas, avaliadas e exibidas com metadados de fonte e frescor."],
      ["Limitações dos dados", "/methodology#limitations", "Consulte a cadência, o escopo e o que cada fonte não permite concluir isoladamente."],
    ],
    steps: [
      ["Verificar", "Coletar dados oficiais ou licenciados na cadência real, sem valores fallback gerados."],
      ["Avaliar", "Aplicar regras determinísticas publicadas aos drivers independentes e excluir evidências ausentes ou vencidas."],
      ["Monitorar", "Mostrar tese, contradições, trilha de fonte e condições explícitas que mudariam a tese."],
    ],
    faq: [
      ["O que é a Dralvo?", "A Dralvo é Gold Decision Intelligence. Ela transforma preço XAUUSD, juros reais, CFTC, COMEX e GLD em uma tese explicável."],
      ["A Dralvo é gratuita?", "Sim. A conta Free oferece preço e evidências centrais. Pro libera a tese completa, alertas, exportações e superfícies adicionais de pesquisa."],
      ["A Dralvo dá sinais de compra ou venda?", "Não. A Dralvo resume contexto para você decidir. Ela não executa ordens, não emite sinais e não presta aconselhamento financeiro."],
      ["Como a Dralvo difere do TradingView?", "TradingView é uma plataforma geral de gráficos. A Dralvo não a substitui. Ela combina evidências especializadas de ouro em uma tese explicável."],
    ],
    pricing: [
      ["Free", "$0", "para sempre", "Disponível agora", ["Contexto central XAUUSD", "Snapshots limitados", "Prévia da tese de hoje", "Fonte e frescor", "Sem cartão"]],
      ["Pro", "$19", "/mês", "Teste de 3 dias", ["Tese completa com fontes", "Cadência verificada", "CFTC, COMEX, GLD, TIPS e XAUUSD", "Alertas personalizados", "Exportação CSV", "Stripe e VietQR"]],
    ],
    workflowRows: [
      ["Juros reais", "Favorável", "text-green"],
      ["Posicionamento CFTC", "Favorável", "text-green"],
      ["Reservas GLD", "Adverso", "text-red"],
      ["Estoque COMEX", "Neutro", "text-gold"],
    ],
  },
} as const;

/* ─── Scroll-reveal hook ─── */
function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}


export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useLocale();
  const localized = PRODUCT_COPY[locale];
  const pageCopy = homeCopy[locale];
  const features = pageCopy.features.map(([icon, title, description]) => ({
    icon,
    title,
    description,
  }));
  const pricing = pageCopy.pricing.map(([name, price, period, label, features], index) => ({
    name,
    price,
    period,
    label,
    highlighted: index === 1,
    features,
    ctaLabel: index === 1 ? pageCopy.pricingCtas.pro : pageCopy.pricingCtas.free,
  }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSignup = () => {
    document.getElementById("signup-cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-deep text-text-primary overflow-x-hidden">
      {/* Gold vein decorative lines — fixed background */}
      <div className="gold-veins fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="v1" />
        <div className="v2" />
        <div className="v3" />
        <div className="h1" />
        <div className="h2" />
      </div>

      {/* ── NAV ── */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-deep/80 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(212,168,67,0.05)]"
            : "bg-transparent"
        )}
      >
        <div className="relative grid w-full max-w-none grid-cols-[auto_1fr_auto] items-center px-8 h-16">
          <BrandLink
            logoSize={42}
            wordmarkClassName="text-2xl transition-colors group-hover:text-text-primary"
          />

          <div className="hidden md:flex items-center justify-end gap-8 pr-10">
            <div className="flex items-center gap-2">
              {pageCopy.navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm text-text-secondary hover:text-gold transition-colors no-underline tracking-[0.02em] whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <span className="h-7 w-px bg-border-gold/50" aria-hidden="true" />
            <LanguageSwitcher className="h-10 min-w-16 shrink-0" />
            <ThemeToggle className="h-10 w-10 shrink-0" />
          </div>

          <div className="hidden md:flex items-center justify-end gap-4">
            <span className="h-7 w-px bg-border-gold/30" aria-hidden="true" />
            <Link
              href="/login"
              className="px-3 py-2 text-sm text-text-secondary hover:text-gold transition-colors no-underline tracking-[0.02em] whitespace-nowrap"
            >
              {pageCopy.signIn}
            </Link>
            <button
              type="button"
              onClick={scrollToSignup}
              className="px-5 py-2 bg-gold-action text-[#060609] rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-actionHover transition-colors whitespace-nowrap"
            >
              {localized.primaryCta}
            </button>
          </div>

          {/* Mobile hamburger — refined spring-like transition */}
          <button
            type="button"
            className="md:hidden ml-auto flex flex-col gap-1.5 p-2 group"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={pageCopy.menu}
            aria-expanded={mobileOpen}
          >
            <span
              className={cn(
                "block w-5 h-px bg-text-primary transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                mobileOpen && "rotate-45 translate-y-[5px]"
              )}
            />
            <span
              className={cn(
                "block w-5 h-px bg-text-primary transition-all duration-200",
                mobileOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
              )}
            />
            <span
              className={cn(
                "block w-5 h-px bg-text-primary transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                mobileOpen && "-rotate-45 -translate-y-[5px]"
              )}
            />
          </button>
        </div>

        <div className={cn("md:hidden overflow-hidden transition-all duration-300", mobileOpen ? "max-h-96" : "max-h-0")}>
          <div className="px-6 py-4 bg-surface border-t border-border flex flex-col gap-3">
            {pageCopy.navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-text-secondary hover:text-gold transition-colors no-underline py-1"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-gold transition-colors no-underline py-1"
              onClick={() => setMobileOpen(false)}
            >
              {pageCopy.signIn}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                scrollToSignup();
              }}
              className="mt-2 px-5 py-2.5 bg-gold-action text-[#060609] rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-actionHover transition-colors"
            >
              {localized.primaryCta}
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* ═══════════════════════════════════════════
            HERO — 4 elements only: eyebrow + headline + subtext + CTAs
            ═══════════════════════════════════════════ */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[800px] h-[800px] -top-40 -right-40" />
          <GlowOrb className="w-[600px] h-[600px] -bottom-20 -left-20" />

          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] gap-12 items-center max-lg:grid-cols-1">
              <div>
                {/* Eyebrow — only one on the entire page */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-border-gold rounded-full text-[11px] tracking-[0.15em] uppercase text-gold mb-8 bg-gold/5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-shimmer" />
                  {localized.productCategory}
                </div>

                {/* Headline — capped at 2 lines on desktop */}
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-[-0.02em] text-text-primary mb-6 max-w-[680px]">
                  {pageCopy.heroTitle}
                </h1>

                <p className="text-lg text-text-secondary leading-relaxed max-w-[560px] mb-10">
                  {localized.corePromise}
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={scrollToSignup}
                    className="px-8 py-3.5 bg-gold-action text-[#060609] rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-actionHover transition-all duration-300 hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)]"
                  >
                    {localized.primaryCta}
                  </button>
                  <Link
                    href="/methodology"
                    className="px-8 py-3.5 border border-border-gold text-gold rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold/10 transition-all duration-300 no-underline"
                  >
                    {pageCopy.viewDemo}
                  </Link>
                </div>
              </div>

              <ChartPreview />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES — Bento grid layout (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="features" className="py-24 border-t border-border relative">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                {pageCopy.featuresTitle}
              </h2>
              <p className="text-text-secondary max-w-[560px] mx-auto">
                {pageCopy.featuresSubtitle}
              </p>
            </div>

            {/* Bento grid: tall + wide + normal tiles */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 auto-rows-[minmax(180px,auto)]">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} delay={index * 80} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DOCS — Centered cards (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="docs" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[1100px] mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                {pageCopy.docsTitle}
              </h2>
              <p className="text-text-secondary max-w-[560px] mx-auto">
                {pageCopy.docsSubtitle}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
              {pageCopy.docs.map(([title, href, copy]) => (
                <DocCard
                  key={title}
                  title={title}
                  href={href}
                  copy={copy}
                  readLabel={pageCopy.docRead}
                  openLabel={pageCopy.docOpen}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DASHBOARD PREVIEW — Full mockup
            ═══════════════════════════════════════════ */}
        <section id="dashboard-preview" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[1100px] mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                {pageCopy.dashboardTitle}
              </h2>
              <p className="text-text-secondary max-w-[620px] mx-auto">
                {pageCopy.dashboardSubtitle}
              </p>
            </div>
            <DashboardMockup />
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — Split-screen layout (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="how-it-works" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[400px] h-[400px] -top-20 -left-20" />
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[1fr_1fr] gap-16 items-center max-lg:grid-cols-1 max-lg:gap-12">
              {/* Left: headline + description */}
              <div>
                <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                  {pageCopy.howTitle}
                </h2>
                <p className="text-text-secondary leading-relaxed max-w-[480px]">
                  {pageCopy.howSubtitle}
                </p>
              </div>

              {/* Right: vertical step cards */}
              <div className="flex flex-col gap-8">
                {pageCopy.steps.map(([title, description], index) => (
                  <StepCard key={title} step={index + 1} title={title} description={description} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ — Accordion (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="faq" className="py-24 border-t border-border relative overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] -bottom-40 -right-40" />
          <div className="max-w-[760px] mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                {pageCopy.faqTitle}
              </h2>
              <p className="text-text-secondary max-w-[520px] mx-auto">
                {pageCopy.faqSubtitle}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {pageCopy.faq.map(([question, answer], i) => (
                <FaqItem key={question} question={question} answer={answer} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            PRICING — Centered cards (no eyebrow)
            ═══════════════════════════════════════════ */}
        <section id="pricing" className="py-24 border-t border-border relative">
          <GlowOrb className="w-[400px] h-[400px] top-0 right-0" />
          <div className="max-w-[1100px] mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                {pageCopy.pricingTitle}
              </h2>
              <p className="text-text-secondary max-w-[620px] mx-auto">
                {pageCopy.pricingSubtitle}
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 max-w-[940px] mx-auto">
              {pricing.map((tier) => (
                <PricingCard key={tier.name} {...tier} onCta={() => { window.location.href = tier.highlighted ? "/pricing" : "/signup"; }} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WAITLIST — With dashboard preview visual
            ═══════════════════════════════════════════ */}
        <section id="signup-cta" className="py-24 border-t border-border relative overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[900px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-[1fr_1fr] gap-12 items-center max-md:grid-cols-1">
              {/* Left: CTA copy + form */}
              <div>
                <h2 className="font-display text-4xl font-normal text-text-primary mb-4 tracking-[-0.01em]">
                  {pageCopy.ctaTitle}
                </h2>
                <p className="text-text-secondary mb-8 max-w-[420px]">
                  {pageCopy.ctaSubtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/signup" className="px-6 py-3 bg-gold-action text-[#060609] rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold-actionHover transition-colors no-underline">
                    {pageCopy.createFree}
                  </Link>
                  <Link href="/pricing" className="px-6 py-3 border border-border-gold text-gold rounded-lg text-sm font-semibold tracking-[0.03em] hover:bg-gold/10 transition-colors no-underline">
                    {pageCopy.startTrial}
                  </Link>
                </div>
              </div>

              {/* Right: evidence workflow preview */}
              <div className="max-md:hidden">
                <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red/70" />
                      <div className="w-2 h-2 rounded-full bg-gold-bright/70" />
                      <div className="w-2 h-2 rounded-full bg-green/70" />
                    </div>
                    <span className="text-[10px] text-text-muted font-mono ml-2">{pageCopy.workflowTitle}</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-text-muted">{pageCopy.todayThesis}</span>
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gold">Mixed</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-3">
                      {pageCopy.workflowRows.map(([label, value, cls]) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-text-muted">{label}</span>
                          <span className={cn("font-mono text-xs font-medium", cls || "text-text-primary")}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-border" />
                    <p className="text-center text-[10px] leading-4 text-text-muted font-mono">
                      {pageCopy.illustrative}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ABOUT / DISCLAIMER
            ═══════════════════════════════════════════ */}
        <section id="about" className="py-16 border-t border-border">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <p className="text-sm leading-relaxed text-text-muted">
              {localized.disclaimer}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ─── Shared Components ─── */

function Stat({ value, label, large = false }: { value: string; label: string; large?: boolean }) {
  return (
    <div className={large ? "text-center group" : ""}>
      <div
        className={cn(
          "font-mono text-text-primary font-medium",
          large
            ? "text-5xl text-gold-bright tracking-[-0.02em] relative inline-block"
            : "text-sm"
        )}
      >
        {large && (
          <span className="absolute -inset-4 rounded-full bg-gold/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        )}
        <span className="relative">{value}</span>
      </div>
      <div className="text-[11px] text-text-muted mt-2 uppercase tracking-[0.12em]">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative bg-surface border border-border rounded-xl p-8 transition-all duration-700 overflow-hidden",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Card-accent: left gold border on hover */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-gold/0 group-hover:bg-gold/60 transition-all duration-500" />
      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-xl mb-5 group-hover:bg-gold/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-display text-xl text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  const { ref, visible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-5 group transition-all duration-700",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
      )}
    >
      <div className="shrink-0 w-12 h-12 rounded-xl bg-gold/10 border border-border-gold flex items-center justify-center font-mono text-gold text-lg font-semibold group-hover:bg-gold/15 transition-colors">
        {step}
      </div>
      <div>
        <h3 className="font-display text-lg text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { ref, visible } = useScrollReveal(0.1);
  const faqId = useId();
  const buttonId = `${faqId}-button`;
  const panelId = `${faqId}-panel`;

  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border rounded-xl overflow-hidden transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        open && "border-border-gold"
      )}
    >
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="font-display text-lg text-text-primary group-hover:text-gold transition-colors pr-4">
          {question}
        </span>
        <span
          className={cn(
            "shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gold transition-all duration-300",
            open
              ? "bg-gold/10 border-border-gold rotate-45"
              : "group-hover:border-border-gold group-hover:bg-gold/5"
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-300"
          >
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  label,
  highlighted,
  features,
  ctaLabel,
  onCta,
}: {
  name: string;
  price: string;
  period: string;
  label: string;
  highlighted: boolean;
  features: readonly string[];
  ctaLabel: string;
  onCta: () => void;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-surface border rounded-2xl p-8 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        highlighted
          ? "border-gold/40 bg-gradient-to-b from-gold/5 to-surface shadow-[0_0_60px_rgba(212,168,67,0.06)]"
          : "border-border hover:border-border-gold"
      )}
    >
      {highlighted && (
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      )}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-card border border-border text-gold text-[11px] font-semibold rounded-full tracking-[0.05em]">
        {label}
      </div>
      <h3 className="font-display text-xl text-text-primary mb-2">{name}</h3>
      <div className="mb-6">
        <span className="font-mono text-4xl font-semibold text-text-primary">{price}</span>
        <span className="text-text-muted text-sm ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
            <span className="text-gold mt-0.5 shrink-0">▸</span>
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-semibold tracking-[0.03em] transition-all duration-300",
          highlighted
            ? "bg-gold-action text-[#060609] hover:bg-gold-actionHover hover:shadow-[0_8px_32px_rgba(212,168,67,0.25)]"
            : "border border-border-gold text-gold hover:bg-gold/10"
        )}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

function DocCard({
  title,
  copy,
  href,
  readLabel,
  openLabel,
}: {
  title: string;
  copy: string;
  href: string;
  readLabel: string;
  openLabel: string;
}) {
  const { ref: divRef, visible: divVisible } = useScrollReveal<HTMLDivElement>(0.1);
  const { ref: linkRef, visible: linkVisible } = useScrollReveal<HTMLAnchorElement>(0.1);
  const internalDoc = href.endsWith(".md");

  const content = (
    <>
      <h3 className="font-display text-xl text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{copy}</p>
    </>
  );

  if (internalDoc) {
    return (
      <div
        ref={divRef}
        className={cn(
          "bg-surface border border-border rounded-xl p-6 transition-all duration-700",
          divVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        {content}
        <p className="text-[11px] text-gold mt-5">{readLabel}</p>
      </div>
    );
  }

  return (
    <Link
      ref={linkRef}
      href={href}
      className={cn(
        "bg-surface border border-border rounded-xl p-6 no-underline transition-all duration-700 hover:border-border-gold",
        linkVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {content}
      <p className="text-[11px] text-gold mt-5">{openLabel}</p>
    </Link>
  );
}
