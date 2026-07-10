import type { SupportedLocale } from "@/lib/i18n";

/**
 * Copy for the free-only pricing model. Dralvo no longer sells the EAs — every
 * robot (GoldMaster, GoldScalp, TiGold, GoldWave) is free to try for 3 days by
 * opening a GTC account under Dralvo's IB. Shared by the homepage `#pricing`
 * section and the standalone /pricing page so both tell the same story.
 */
export interface PricingFreeCopy {
  eyebrow: string;
  title: string;
  intro: string;
  priceWord: string; // shown big in place of a price, e.g. "Miễn phí"
  trialBadge: string;
  eas: string[];
  features: string[];
  primaryCta: string;
  telegramCta: string;
  stepsTitle: string;
  steps: string[];
  renewNote: string;
  renewCta: string;
  disclaimer: string;
}

const EAS = ["GoldMaster", "GoldScalp", "TiGold", "GoldWave"];

export const RENEW_ADMIN_URL = "https://t.me/edgardinh86";
export const SUPPORT_TELEGRAM_URL = "https://t.me/dralvoea";

export const PRICING_FREE_COPY: Record<SupportedLocale, PricingFreeCopy> = {
  vi: {
    eyebrow: "Miễn phí 100%",
    title: "Tất cả EA Dralvo — miễn phí",
    intro:
      "Dralvo không bán bot. Mở tài khoản GTC qua link IB của Dralvo (không cần nạp tiền) là nhận key dùng thử toàn bộ EA — GoldMaster, GoldScalp, TiGold, GoldWave.",
    priceWord: "Miễn phí",
    trialBadge: "Key dùng thử 3 ngày",
    eas: EAS,
    features: [
      "Cả 4 EA đều miễn phí",
      "Key dùng thử 3 ngày cho mỗi EA",
      "1 tài khoản MT5 thật qua IB Dralvo",
      "Công cụ tính lot + cộng đồng Telegram",
      "Không thẻ tín dụng, không phí hàng tháng",
    ],
    primaryCta: "Mở tài khoản & nhận EA",
    telegramCta: "Hỏi đáp qua Telegram",
    stepsTitle: "Nhận EA trong 3 bước",
    steps: [
      "Mở tài khoản GTC qua link IB của Dralvo",
      "Đăng nhập dashboard → bấm “Kích hoạt qua Telegram”",
      "Admin duyệt → nhận key dùng thử 3 ngày ngay trong chat",
    ],
    renewNote: "Hết 3 ngày, muốn lấy key mới hoặc gia hạn thì nhắn admin:",
    renewCta: "Liên hệ admin",
    disclaimer:
      "Công cụ giao dịch tự động, không phải lời khuyên tài chính. Giao dịch có rủi ro — luôn quản lý vốn.",
  },
  en: {
    eyebrow: "100% free",
    title: "Every Dralvo EA — free",
    intro:
      "Dralvo doesn't sell bots. Open a GTC account through Dralvo's IB link (no deposit needed) and get a trial key for every EA — GoldMaster, GoldScalp, TiGold, GoldWave.",
    priceWord: "Free",
    trialBadge: "3-day trial key",
    eas: EAS,
    features: [
      "All 4 EAs free",
      "3-day trial key for each EA",
      "1 real MT5 account via Dralvo IB",
      "Lot calculator + Telegram community",
      "No credit card, no monthly fee",
    ],
    primaryCta: "Open account & get the EAs",
    telegramCta: "Ask on Telegram",
    stepsTitle: "Get the EAs in 3 steps",
    steps: [
      "Open a GTC account via Dralvo's IB link",
      "Sign in to the dashboard → tap “Activate via Telegram”",
      "Admin approves → get your 3-day trial key right in chat",
    ],
    renewNote: "After 3 days, message the admin for a new key or a renewal:",
    renewCta: "Contact admin",
    disclaimer:
      "Automated trading tool, not financial advice. Trading carries risk — always manage your capital.",
  },
  "pt-BR": {
    eyebrow: "100% grátis",
    title: "Todos os EAs da Dralvo — grátis",
    intro:
      "A Dralvo não vende bots. Abra uma conta GTC pelo link de IB da Dralvo (sem depósito) e receba uma chave de teste para cada EA — GoldMaster, GoldScalp, TiGold, GoldWave.",
    priceWord: "Grátis",
    trialBadge: "Chave de teste de 3 dias",
    eas: EAS,
    features: [
      "Os 4 EAs grátis",
      "Chave de teste de 3 dias para cada EA",
      "1 conta real MT5 via IB Dralvo",
      "Calculadora de lote + comunidade no Telegram",
      "Sem cartão de crédito, sem mensalidade",
    ],
    primaryCta: "Abrir conta e receber os EAs",
    telegramCta: "Perguntar no Telegram",
    stepsTitle: "Receba os EAs em 3 passos",
    steps: [
      "Abra uma conta GTC pelo link de IB da Dralvo",
      "Entre no dashboard → toque em “Ativar via Telegram”",
      "O admin aprova → receba sua chave de teste de 3 dias no chat",
    ],
    renewNote: "Após 3 dias, fale com o admin para uma nova chave ou renovação:",
    renewCta: "Falar com o admin",
    disclaimer:
      "Ferramenta de trading automatizado, não é aconselhamento financeiro. Trading tem risco — sempre gerencie seu capital.",
  },
  es: {
    eyebrow: "100% gratis",
    title: "Todos los EA de Dralvo — gratis",
    intro:
      "Dralvo no vende bots. Abre una cuenta GTC con el enlace de IB de Dralvo (sin depósito) y recibe una clave de prueba para cada EA — GoldMaster, GoldScalp, TiGold, GoldWave.",
    priceWord: "Gratis",
    trialBadge: "Clave de prueba de 3 días",
    eas: EAS,
    features: [
      "Los 4 EA gratis",
      "Clave de prueba de 3 días por cada EA",
      "1 cuenta real MT5 vía IB Dralvo",
      "Calculadora de lotes + comunidad de Telegram",
      "Sin tarjeta de crédito, sin cuota mensual",
    ],
    primaryCta: "Abrir cuenta y recibir los EA",
    telegramCta: "Preguntar en Telegram",
    stepsTitle: "Consigue los EA en 3 pasos",
    steps: [
      "Abre una cuenta GTC con el enlace de IB de Dralvo",
      "Inicia sesión en el panel → toca “Activar por Telegram”",
      "El admin aprueba → recibe tu clave de prueba de 3 días en el chat",
    ],
    renewNote: "Tras 3 días, escribe al admin para una nueva clave o renovación:",
    renewCta: "Contactar al admin",
    disclaimer:
      "Herramienta de trading automatizado, no es asesoramiento financiero. El trading tiene riesgo — gestiona siempre tu capital.",
  },
  id: {
    eyebrow: "100% gratis",
    title: "Semua EA Dralvo — gratis",
    intro:
      "Dralvo tidak menjual bot. Buka akun GTC lewat tautan IB Dralvo (tanpa deposit) dan dapatkan kunci uji coba untuk setiap EA — GoldMaster, GoldScalp, TiGold, GoldWave.",
    priceWord: "Gratis",
    trialBadge: "Kunci uji coba 3 hari",
    eas: EAS,
    features: [
      "Keempat EA gratis",
      "Kunci uji coba 3 hari untuk tiap EA",
      "1 akun live MT5 via IB Dralvo",
      "Kalkulator lot + komunitas Telegram",
      "Tanpa kartu kredit, tanpa biaya bulanan",
    ],
    primaryCta: "Buka akun & dapatkan EA",
    telegramCta: "Tanya di Telegram",
    stepsTitle: "Dapatkan EA dalam 3 langkah",
    steps: [
      "Buka akun GTC lewat tautan IB Dralvo",
      "Masuk ke dashboard → ketuk “Aktifkan via Telegram”",
      "Admin menyetujui → terima kunci uji coba 3 hari di chat",
    ],
    renewNote: "Setelah 3 hari, hubungi admin untuk kunci baru atau perpanjangan:",
    renewCta: "Hubungi admin",
    disclaimer:
      "Alat trading otomatis, bukan nasihat keuangan. Trading berisiko — selalu kelola modal Anda.",
  },
  ar: {
    eyebrow: "مجاني 100%",
    title: "كل روبوتات Dralvo — مجاناً",
    intro:
      "Dralvo لا تبيع الروبوتات. افتح حساب GTC عبر رابط IB الخاص بـ Dralvo (بدون إيداع) واحصل على مفتاح تجريبي لكل EA — GoldMaster وGoldScalp وTiGold وGoldWave.",
    priceWord: "مجاناً",
    trialBadge: "مفتاح تجريبي 3 أيام",
    eas: EAS,
    features: [
      "جميع الروبوتات الأربعة مجاناً",
      "مفتاح تجريبي 3 أيام لكل EA",
      "حساب MT5 حقيقي واحد عبر IB Dralvo",
      "حاسبة اللوت + مجتمع Telegram",
      "بدون بطاقة ائتمان وبدون رسوم شهرية",
    ],
    primaryCta: "افتح حساباً واحصل على الروبوتات",
    telegramCta: "اسأل عبر Telegram",
    stepsTitle: "احصل على الروبوتات في 3 خطوات",
    steps: [
      "افتح حساب GTC عبر رابط IB الخاص بـ Dralvo",
      "سجّل الدخول إلى لوحة التحكم → اضغط «تفعيل عبر تيليجرام»",
      "يوافق المشرف → تصلك مفتاحك التجريبي لمدة 3 أيام في الدردشة",
    ],
    renewNote: "بعد 3 أيام، راسل المشرف للحصول على مفتاح جديد أو تجديد:",
    renewCta: "تواصل مع المشرف",
    disclaimer:
      "أداة تداول آلية وليست نصيحة مالية. التداول ينطوي على مخاطر — أدِر رأس مالك دائماً.",
  },
};
