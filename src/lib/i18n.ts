export const SUPPORTED_LOCALES = [
  "vi",
  "en",
  "pt-BR",
  "zh",
  "es",
  "hi",
  "id",
  "ru",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "vi";

/** Locale used as the fallback for any copy not yet translated. */
export const FALLBACK_LOCALE: SupportedLocale = "en";

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  "pt-BR": "Português BR",
  zh: "中文",
  es: "Español",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  ru: "Русский",
};

export const LOCALE_SHORT_LABELS: Record<SupportedLocale, string> = {
  vi: "VI",
  en: "EN",
  "pt-BR": "PT-BR",
  zh: "ZH",
  es: "ES",
  hi: "HI",
  id: "ID",
  ru: "RU",
};

export const LOCALE_COOKIE = "dralvo-locale";
export const LOCALE_STORAGE_KEY = "dralvo-locale";
export const LOCALE_CHANGE_EVENT = "dralvo:locale-change";

export function isSupportedLocale(
  locale: string | null | undefined,
): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function normalizeLocale(
  locale: string | null | undefined,
): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE;
  if (isSupportedLocale(locale)) return locale;

  const lower = locale.toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("vi")) return "vi";
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("hi")) return "hi";
  if (lower.startsWith("id")) return "id";
  if (lower.startsWith("ru")) return "ru";

  return DEFAULT_LOCALE;
}

/**
 * Build a complete locale->copy record from a partial set of translations.
 * Any locale not provided falls back to the FALLBACK_LOCALE ("en") entry, so
 * new languages can be added incrementally without breaking the build or
 * leaving `undefined` holes. The fallback entry is required.
 */
type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge a (possibly partial) locale override on top of the base copy. */
function deepMergeCopy<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(over)) {
    out[k] = deepMergeCopy((base as Record<string, unknown>)[k], over[k]);
  }
  return out as T;
}

export function withLocaleFallback<T>(
  copy: { en: T } & Partial<Record<SupportedLocale, DeepPartial<NoInfer<T>>>>,
): Record<SupportedLocale, T> {
  const full = {} as Record<SupportedLocale, T>;
  for (const loc of SUPPORTED_LOCALES) {
    full[loc] = deepMergeCopy(copy.en, copy[loc]);
  }
  return full;
}

/**
 * Read a copy entry for a locale from a partial map (e.g. component-local copy
 * that is not yet translated for every locale), falling back to "en" then to
 * the default locale. Lets V1 surfaces tolerate the expanded locale set.
 */
export function pickLocale<T>(
  copy: Partial<Record<SupportedLocale, T>>,
  locale: SupportedLocale,
): T {
  return (copy[locale] ?? copy[FALLBACK_LOCALE] ?? copy[DEFAULT_LOCALE]) as T;
}

export const PRODUCT_COPY = withLocaleFallback({
  vi: {
    productCategory: "Trí tuệ quyết định cho thị trường vàng",
    primaryCta: "Bắt đầu miễn phí",
    proCta: "Nâng cấp Pro",
    corePromise:
      "Dralvo kết hợp vị thế, tồn kho, lượng vàng ETF, lợi suất thực và giá XAUUSD thành một luận điểm vàng có thể truy xuất nguồn.",
    disclaimer:
      "Dralvo chỉ cung cấp thông tin thị trường, không phải tư vấn tài chính hay tín hiệu mua bán.",
  },
  en: {
    productCategory: "Gold Decision Intelligence",
    primaryCta: "Start Free",
    proCta: "Upgrade to Pro",
    corePromise:
      "Dralvo turns positioning, inventory, ETF holdings, real yields, and XAUUSD price into a source-backed gold thesis.",
    disclaimer:
      "Dralvo provides market information only. It is not financial advice or a buy/sell signal.",
  },
  "pt-BR": {
    productCategory: "Inteligência de Decisão para Ouro",
    primaryCta: "Começar grátis",
    proCta: "Atualizar para Pro",
    corePromise:
      "A Dralvo transforma posicionamento, estoques, reservas de ETFs, juros reais e o preço do XAUUSD em uma tese de ouro com fontes rastreáveis.",
    disclaimer:
      "A Dralvo fornece apenas informações de mercado. Não é aconselhamento financeiro nem sinal de compra ou venda.",
  },
});

export const TRACK_RECORD_COPY = withLocaleFallback({
  vi: {
    nav: "Hiệu suất",
    back: "Về trang chủ",
    title: "Hiệu suất thật, công khai",
    subtitle:
      "Chúng tôi không vẽ đường cong. Đây là toàn bộ số liệu backtest 20 năm và kỳ vọng thật — cả mặt tốt lẫn mặt xấu.",
    backtestHeading: "Backtest 20 năm (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · vốn ban đầu $100,000",
    expectationsHeading: "Kỳ vọng thật — đọc trước khi dùng",
    expectations: [
      "Tỉ lệ thắng ~37% — bạn THUA nhiều lần hơn THẮNG. Edge nằm ở tỉ lệ Lời/Lỗ ~3.4:1.",
      "Có thể thua tới 10 lệnh liên tiếp. Drawdown lịch sử tối đa ~25%.",
      "Long-only: 0 lệnh khi vàng giảm (CFTC bearish) = bảo toàn vốn, không phải lỗi.",
      "Hiệu suất backtest quá khứ không đảm bảo lợi nhuận tương lai.",
    ],
    liveHeading: "Track record trực tiếp (Myfxbook)",
    liveSoon:
      "Tài khoản demo/thực đang chạy EA sẽ được công khai tại đây. Cập nhật liên tục — kể cả khi đứng yên hoặc thua.",
    disclaimer:
      "Không phải lời khuyên đầu tư. Backtest là dữ liệu quá khứ. Past performance ≠ future results.",
  },
  en: {
    nav: "Track Record",
    back: "Back to home",
    title: "Real performance, in the open",
    subtitle:
      "We don't curve-fit. Here is the full 20-year backtest and the honest expectations — the good and the bad.",
    backtestHeading: "20-year backtest (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · $100,000 starting balance",
    expectationsHeading: "Honest expectations — read before you trade",
    expectations: [
      "Win rate ~37% — you LOSE more often than you WIN. The edge is a ~3.4:1 reward-to-risk ratio.",
      "You can lose up to 10 trades in a row. Maximum historical drawdown ~25%.",
      "Long only: 0 trades when gold is bearish (CFTC bearish) = capital preserved, not a malfunction.",
      "Past backtest performance does not guarantee future results.",
    ],
    liveHeading: "Live track record (Myfxbook)",
    liveSoon:
      "A demo/live account running the EA will be published here — updated continuously, including dormant or losing periods.",
    disclaimer:
      "Not financial advice. Backtest is historical data. Past performance does not guarantee future results.",
  },
  "pt-BR": {
    nav: "Histórico",
    back: "Voltar ao início",
    title: "Desempenho real, à mostra",
    subtitle:
      "Não fazemos curve-fitting. Aqui está o backtest completo de 20 anos e as expectativas honestas — o bom e o ruim.",
    backtestHeading: "Backtest de 20 anos (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · saldo inicial de $100.000",
    expectationsHeading: "Expectativas honestas — leia antes de operar",
    expectations: [
      "Taxa de acerto ~37% — você PERDE mais vezes do que GANHA. O edge é uma relação risco-retorno de ~3,4:1.",
      "Você pode perder até 10 operações seguidas. Drawdown histórico máximo ~25%.",
      "Somente compra: 0 operações quando o ouro está em baixa (CFTC bearish) = capital preservado, não é falha.",
      "Desempenho passado em backtest não garante resultados futuros.",
    ],
    liveHeading: "Histórico ao vivo (Myfxbook)",
    liveSoon:
      "Uma conta demo/real rodando o EA será publicada aqui — atualizada continuamente, incluindo períodos parados ou de perda.",
    disclaimer:
      "Não é aconselhamento financeiro. Backtest é dado histórico. Resultados passados não garantem resultados futuros.",
  },
  zh: {
    nav: "业绩记录",
    back: "返回首页",
    title: "真实业绩，公开透明",
    subtitle:
      "我们不做曲线拟合。这里是完整的20年回测数据和真实预期——好的与坏的都在。",
    backtestHeading: "20年回测（MT5 策略测试器）",
    backtestNote: "XAUUSD · 日线 · 2006–2026 · 初始资金 $100,000",
    expectationsHeading: "真实预期——交易前请阅读",
    expectations: [
      "胜率约37%——亏损次数多于盈利次数。优势在于约3.4:1的盈亏比。",
      "可能连续亏损多达10笔。历史最大回撤约25%。",
      "仅做多：黄金看跌时（CFTC 看跌）0 笔交易＝保住资金，并非故障。",
      "过往回测业绩不代表未来收益。",
    ],
    liveHeading: "实时业绩记录（Myfxbook）",
    liveSoon:
      "运行该 EA 的模拟/实盘账户将在此公开——持续更新，包括无交易或亏损时段。",
    disclaimer:
      "非投资建议。回测为历史数据。过往业绩不保证未来结果。",
  },
  es: {
    nav: "Historial",
    back: "Volver al inicio",
    title: "Rendimiento real, a la vista",
    subtitle:
      "No ajustamos la curva. Aquí está el backtest completo de 20 años y las expectativas honestas: lo bueno y lo malo.",
    backtestHeading: "Backtest de 20 años (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · saldo inicial de $100,000",
    expectationsHeading: "Expectativas honestas: léelas antes de operar",
    expectations: [
      "Tasa de acierto ~37%: pierdes más veces de las que ganas. La ventaja es una relación riesgo-beneficio de ~3,4:1.",
      "Puedes perder hasta 10 operaciones seguidas. Drawdown histórico máximo ~25%.",
      "Solo largos: 0 operaciones cuando el oro es bajista (CFTC bajista) = capital preservado, no es un fallo.",
      "El rendimiento pasado en backtest no garantiza resultados futuros.",
    ],
    liveHeading: "Historial en vivo (Myfxbook)",
    liveSoon:
      "Una cuenta demo/real ejecutando el EA se publicará aquí, actualizada continuamente, incluso en periodos inactivos o de pérdidas.",
    disclaimer:
      "No es asesoramiento financiero. El backtest es dato histórico. El rendimiento pasado no garantiza resultados futuros.",
  },
  hi: {
    nav: "ट्रैक रिकॉर्ड",
    back: "होम पर लौटें",
    title: "वास्तविक प्रदर्शन, खुले तौर पर",
    subtitle:
      "हम कर्व-फिटिंग नहीं करते। यहाँ पूरा 20-वर्षीय बैकटेस्ट और ईमानदार अपेक्षाएँ हैं — अच्छा और बुरा दोनों।",
    backtestHeading: "20-वर्षीय बैकटेस्ट (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · शुरुआती बैलेंस $100,000",
    expectationsHeading: "ईमानदार अपेक्षाएँ — ट्रेड करने से पहले पढ़ें",
    expectations: [
      "जीत दर ~37% — आप जीतने से ज़्यादा बार हारते हैं। बढ़त ~3.4:1 के रिस्क-रिवॉर्ड अनुपात में है।",
      "आप लगातार 10 ट्रेड तक हार सकते हैं। अधिकतम ऐतिहासिक ड्रॉडाउन ~25%।",
      "केवल लॉन्ग: जब सोना बेयरिश हो (CFTC बेयरिश) तब 0 ट्रेड = पूँजी सुरक्षित, कोई खराबी नहीं।",
      "पिछला बैकटेस्ट प्रदर्शन भविष्य के परिणामों की गारंटी नहीं देता।",
    ],
    liveHeading: "लाइव ट्रैक रिकॉर्ड (Myfxbook)",
    liveSoon:
      "EA चलाने वाला एक डेमो/लाइव अकाउंट यहाँ प्रकाशित किया जाएगा — लगातार अपडेट होता रहेगा, निष्क्रिय या नुकसान वाली अवधि सहित।",
    disclaimer:
      "यह वित्तीय सलाह नहीं है। बैकटेस्ट ऐतिहासिक डेटा है। पिछला प्रदर्शन भविष्य के परिणामों की गारंटी नहीं देता।",
  },
  id: {
    nav: "Rekam Jejak",
    back: "Kembali ke beranda",
    title: "Kinerja nyata, terbuka",
    subtitle:
      "Kami tidak melakukan curve-fitting. Inilah backtest 20 tahun lengkap dan ekspektasi jujur — yang baik dan yang buruk.",
    backtestHeading: "Backtest 20 tahun (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · saldo awal $100,000",
    expectationsHeading: "Ekspektasi jujur — baca sebelum trading",
    expectations: [
      "Win rate ~37% — Anda lebih sering kalah daripada menang. Keunggulannya pada rasio risk-reward ~3,4:1.",
      "Anda bisa kalah hingga 10 transaksi berturut-turut. Drawdown historis maksimum ~25%.",
      "Hanya long: 0 transaksi saat emas bearish (CFTC bearish) = modal terjaga, bukan kerusakan.",
      "Kinerja backtest masa lalu tidak menjamin hasil di masa depan.",
    ],
    liveHeading: "Rekam jejak langsung (Myfxbook)",
    liveSoon:
      "Akun demo/live yang menjalankan EA akan dipublikasikan di sini — diperbarui terus-menerus, termasuk periode tidak aktif atau rugi.",
    disclaimer:
      "Bukan nasihat keuangan. Backtest adalah data historis. Kinerja masa lalu tidak menjamin hasil masa depan.",
  },
  ru: {
    nav: "История сделок",
    back: "На главную",
    title: "Реальные результаты, открыто",
    subtitle:
      "Мы не подгоняем кривую. Здесь полный 20-летний бэктест и честные ожидания — и хорошее, и плохое.",
    backtestHeading: "20-летний бэктест (MT5 Strategy Tester)",
    backtestNote: "XAUUSD · D1 · 2006–2026 · начальный баланс $100,000",
    expectationsHeading: "Честные ожидания — прочтите перед торговлей",
    expectations: [
      "Винрейт ~37% — вы проигрываете чаще, чем выигрываете. Преимущество в соотношении риск/прибыль ~3,4:1.",
      "Можно получить до 10 убыточных сделок подряд. Максимальная историческая просадка ~25%.",
      "Только покупка: 0 сделок, когда золото медвежье (CFTC медвежий) = капитал сохранён, это не сбой.",
      "Прошлые результаты бэктеста не гарантируют будущую доходность.",
    ],
    liveHeading: "Живая история сделок (Myfxbook)",
    liveSoon:
      "Демо/реальный счёт с этим EA будет опубликован здесь — постоянно обновляется, включая периоды простоя или убытков.",
    disclaimer:
      "Не финансовая консультация. Бэктест — это исторические данные. Прошлые результаты не гарантируют будущих.",
  },
});

export const AUTH_COPY = withLocaleFallback({
  vi: {
    tagline: "Trí tuệ vàng cho tổ chức",
    dividerText: "hoặc",
    googleSignIn: "Đăng nhập với Google",
    googleSignUp: "Đăng ký với Google",
    googleLoading: "Đang xác thực...",
    email: "Email",
    password: "Mật khẩu",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "Mật khẩu",
    minPasswordPlaceholder: "Tối thiểu 8 ký tự",
    hidePassword: "Ẩn mật khẩu",
    showPassword: "Hiện mật khẩu",
    passwordTooShort: "Mật khẩu phải có ít nhất 8 ký tự",
    signup: {
      title: "Tạo tài khoản",
      subtitle: "Tạo tài khoản Dralvo miễn phí",
      submit: "Tạo tài khoản",
      loading: "Đang tạo tài khoản...",
      successTitle: "Kiểm tra email của bạn",
      successBodyPrefix: "Dralvo đã gửi liên kết xác nhận tới",
      successBodySuffix: "Nhấn vào liên kết để xác minh tài khoản.",
      goToLogin: "Đến trang đăng nhập",
      existing: "Đã có tài khoản?",
      existingCta: "Đăng nhập",
      passwordRequirement: "Tối thiểu 8 ký tự.",
      legalPrefix: "Khi tạo tài khoản, bạn đồng ý với",
      terms: "Điều khoản",
      privacy: "Chính sách riêng tư",
    },
    login: {
      title: "Chào mừng trở lại",
      subtitle: "Đăng nhập để vào dashboard",
      forgot: "Quên mật khẩu?",
      submit: "Đăng nhập",
      loading: "Đang đăng nhập...",
      noAccount: "Chưa có tài khoản?",
      noAccountCta: "Tạo tài khoản",
      callbackError: "Không thể xác minh phiên đăng nhập. Vui lòng thử lại.",
    },
    reset: {
      title: "Đặt lại mật khẩu",
      subtitle: "Nhập email và Dralvo sẽ gửi liên kết đặt lại mật khẩu",
      submit: "Gửi liên kết đặt lại",
      loading: "Đang gửi liên kết...",
      successTitle: "Kiểm tra email của bạn",
      successBodyPrefix: "Dralvo đã gửi liên kết đặt lại mật khẩu tới",
      backToLogin: "Quay lại đăng nhập",
      updateTitle: "Tạo mật khẩu mới",
      updateSubtitle: "Nhập mật khẩu mới để hoàn tất khôi phục tài khoản.",
      newPassword: "Mật khẩu mới",
      confirmPassword: "Xác nhận mật khẩu",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu mới",
      passwordsDoNotMatch: "Hai mật khẩu không khớp.",
      invalidLinkTitle: "Liên kết không hợp lệ hoặc đã hết hạn",
      invalidLinkBody: "Vui lòng yêu cầu liên kết đặt lại mới để tiếp tục.",
      updateSubmit: "Cập nhật mật khẩu",
      updateLoading: "Đang cập nhật mật khẩu...",
      updateSuccessTitle: "Mật khẩu đã được cập nhật",
      updateSuccessBody: "Bạn có thể đăng nhập bằng mật khẩu mới.",
      requestAnotherLink: "Gửi liên kết mới",
    },
  },
  en: {
    tagline: "Institutional Gold Intelligence",
    dividerText: "or",
    googleSignIn: "Sign in with Google",
    googleSignUp: "Sign up with Google",
    googleLoading: "Authenticating...",
    email: "Email",
    password: "Password",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "Password",
    minPasswordPlaceholder: "Min. 8 characters",
    hidePassword: "Hide password",
    showPassword: "Show password",
    passwordTooShort: "Password must be at least 8 characters",
    signup: {
      title: "Create account",
      subtitle: "Create your free Dralvo account",
      submit: "Create Account",
      loading: "Creating account...",
      successTitle: "Check your email",
      successBodyPrefix: "We've sent a confirmation link to",
      successBodySuffix: "Click the link to verify your account.",
      goToLogin: "Go to login",
      existing: "Already have an account?",
      existingCta: "Sign in",
      passwordRequirement: "Use at least 8 characters.",
      legalPrefix: "By creating an account, you agree to the",
      terms: "Terms",
      privacy: "Privacy Policy",
    },
    login: {
      title: "Welcome back",
      subtitle: "Sign in to access your dashboard",
      forgot: "Forgot password?",
      submit: "Sign In",
      loading: "Signing in...",
      noAccount: "Don't have an account?",
      noAccountCta: "Create one",
      callbackError: "We could not verify your sign-in session. Please try again.",
    },
    reset: {
      title: "Reset password",
      subtitle: "Enter your email and we'll send you a reset link",
      submit: "Send Reset Link",
      loading: "Sending reset link...",
      successTitle: "Check your email",
      successBodyPrefix: "We've sent a password reset link to",
      backToLogin: "Back to login",
      updateTitle: "Create a new password",
      updateSubtitle: "Enter a new password to finish recovering your account.",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter new password",
      passwordsDoNotMatch: "Passwords do not match.",
      invalidLinkTitle: "Invalid or expired link",
      invalidLinkBody: "Please request a new password reset link to continue.",
      updateSubmit: "Update password",
      updateLoading: "Updating password...",
      updateSuccessTitle: "Password updated",
      updateSuccessBody: "You can now sign in with your new password.",
      requestAnotherLink: "Send a new link",
    },
  },
  "pt-BR": {
    tagline: "Inteligência Institucional para Ouro",
    dividerText: "ou",
    googleSignIn: "Entrar com Google",
    googleSignUp: "Cadastrar com Google",
    googleLoading: "Autenticando...",
    email: "Email",
    password: "Senha",
    emailPlaceholder: "voce@exemplo.com",
    passwordPlaceholder: "Senha",
    minPasswordPlaceholder: "Mín. 8 caracteres",
    hidePassword: "Ocultar senha",
    showPassword: "Mostrar senha",
    passwordTooShort: "A senha deve ter pelo menos 8 caracteres",
    signup: {
      title: "Criar conta",
      subtitle: "Crie sua conta gratuita na Dralvo",
      submit: "Criar conta",
      loading: "Criando conta...",
      successTitle: "Verifique seu email",
      successBodyPrefix: "Enviamos um link de confirmação para",
      successBodySuffix: "Clique no link para verificar sua conta.",
      goToLogin: "Ir para login",
      existing: "Já tem uma conta?",
      existingCta: "Entrar",
      passwordRequirement: "Use pelo menos 8 caracteres.",
      legalPrefix: "Ao criar uma conta, você concorda com os",
      terms: "Termos",
      privacy: "Política de Privacidade",
    },
    login: {
      title: "Bem-vindo de volta",
      subtitle: "Entre para acessar seu painel",
      forgot: "Esqueceu a senha?",
      submit: "Entrar",
      loading: "Entrando...",
      noAccount: "Ainda não tem conta?",
      noAccountCta: "Criar conta",
      callbackError: "Não foi possível verificar sua sessão. Tente novamente.",
    },
    reset: {
      title: "Redefinir senha",
      subtitle: "Informe seu email e enviaremos um link de redefinição",
      submit: "Enviar link",
      loading: "Enviando link...",
      successTitle: "Verifique seu email",
      successBodyPrefix: "Enviamos um link de redefinição de senha para",
      backToLogin: "Voltar ao login",
      updateTitle: "Criar nova senha",
      updateSubtitle: "Digite uma nova senha para concluir a recuperação da conta.",
      newPassword: "Nova senha",
      confirmPassword: "Confirmar senha",
      confirmPasswordPlaceholder: "Digite a nova senha novamente",
      passwordsDoNotMatch: "As senhas não coincidem.",
      invalidLinkTitle: "Link inválido ou expirado",
      invalidLinkBody: "Solicite um novo link de redefinição para continuar.",
      updateSubmit: "Atualizar senha",
      updateLoading: "Atualizando senha...",
      updateSuccessTitle: "Senha atualizada",
      updateSuccessBody: "Agora você pode entrar com a nova senha.",
      requestAnotherLink: "Enviar novo link",
    },
  },
});

export const LEGAL_COPY = withLocaleFallback({
  vi: {
    badgeLegal: "Pháp lý",
    badgeImportant: "Quan trọng",
    backHome: "Về trang chủ",
    updatedLabel: "Cập nhật lần cuối",
    updated: "Tháng 6 2026",
    privacy: {
      title: "Quyền riêng tư",
      accent: "Dữ liệu",
      sections: [
        ["1. Tổng quan", "Dralvo thu thập dữ liệu tối thiểu cần thiết để vận hành tài khoản và cải thiện nền tảng phân tích XAUUSD. Dữ liệu này gồm email người dùng gửi và dữ liệu tài khoản, sử dụng cần thiết cho ứng dụng."],
        ["2. Thông tin chúng tôi thu thập", "Cho vận hành tài khoản và sản phẩm, Dralvo thu thập email, nguồn đăng ký, thời điểm đăng ký, dữ liệu xác thực, tùy chọn cảnh báo, cài đặt dashboard và trạng thái đăng ký."],
        ["3. Cách chúng tôi sử dụng dữ liệu", "Dralvo dùng dữ liệu để quản lý truy cập tài khoản, gửi cập nhật sản phẩm, vận hành dashboard, bảo mật tài khoản và cải thiện dịch vụ. Dralvo không bán thông tin cá nhân."],
        ["4. Dịch vụ bên thứ ba", "Dralvo có thể dùng Supabase cho cơ sở dữ liệu/xác thực, Stripe cho thanh toán, nhà cung cấp email cho thông báo giao dịch và nhà cung cấp dữ liệu thị trường cho đầu vào bằng chứng."],
        ["5. Quyền dữ liệu", "Người dùng có thể yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bằng cách liên hệ legal@dralvo.com. Một số yêu cầu cần xác minh danh tính."],
        ["6. Bảo mật", "Dralvo áp dụng biện pháp kỹ thuật và tổ chức hợp lý cho dữ liệu tài khoản và sản phẩm, bao gồm lưu trữ phía server, phân quyền truy cập và khóa dịch vụ tách theo môi trường. Không hệ thống điện tử nào được bảo đảm an toàn tuyệt đối."],
      ],
    },
    terms: {
      title: "Điều khoản",
      accent: "Dịch vụ",
      sections: [
        ["1. Chấp nhận", "Khi sử dụng Dralvo, bạn đồng ý với các điều khoản này. Nếu không đồng ý, vui lòng không sử dụng website, dashboard hoặc dịch vụ liên quan."],
        ["2. Phạm vi sản phẩm", "Dralvo cung cấp dashboard thông tin XAUUSD, ngữ cảnh bằng chứng và công cụ phân tích. Dralvo không thực hiện giao dịch, quản lý tiền hoặc hoạt động như broker, cố vấn đầu tư hay nhà lập kế hoạch tài chính."],
        ["3. Trách nhiệm người dùng", "Bạn chịu trách nhiệm cho quyết định giao dịch, quản trị rủi ro, bảo mật tài khoản và tuân thủ luật áp dụng cho bạn."],
        ["4. Tài khoản và truy cập", "Bạn chịu trách nhiệm giữ an toàn thông tin đăng nhập. Dralvo có thể giới hạn, tạm ngưng hoặc thu hồi quyền truy cập khi cần bảo vệ hệ thống, ngăn lạm dụng, xử lý vi phạm điều khoản hoặc tuân thủ yêu cầu pháp lý."],
        ["5. Thanh toán, dùng thử và hủy gói", "Gói Pro được thanh toán qua Stripe trừ khi phương thức khác được hiển thị rõ tại checkout. Một số đăng ký Pro mới có thể có 3 ngày dùng thử; nếu checkout yêu cầu phương thức thanh toán, phí định kỳ sẽ bắt đầu khi thời gian dùng thử kết thúc trừ khi bạn hủy trước đó. Bạn có thể hủy qua billing portal; quyền truy cập Pro tiếp tục đến cuối kỳ đã thanh toán. Thuế, hoàn tiền và điều kiện thanh toán bổ sung phụ thuộc thông tin hiển thị tại checkout hoặc hóa đơn."],
        ["6. Tính khả dụng", "Dữ liệu thị trường, bằng chứng, thông báo và dashboard có thể bị trễ, thiếu hoặc không khả dụng do nguồn dữ liệu, nhà cung cấp hạ tầng hoặc bảo trì hệ thống. Dralvo cố gắng hiển thị trạng thái nguồn và độ mới khi có thể, nhưng không bảo đảm dữ liệu luôn liên tục hoặc không lỗi."],
      ],
    },
    disclaimer: {
      title: "Tuyên bố",
      accent: "Tài chính",
      sections: [
        ["Chỉ nhằm mục đích thông tin", "Dralvo chỉ cung cấp thông tin, không phải tư vấn tài chính. Không nội dung nào trên Dralvo nên được hiểu là khuyến nghị mua, bán, nắm giữ hoặc giao dịch vàng, XAUUSD, CFD, futures, ETF, crypto hay công cụ khác."],
        ["Không tạo quan hệ tư vấn đầu tư", "Dralvo không phải broker, dealer, cố vấn đầu tư, cố vấn giao dịch hàng hóa hay nhà lập kế hoạch tài chính. Việc sử dụng Dralvo không tạo quan hệ tư vấn."],
        ["Rủi ro giao dịch", "Giao dịch XAUUSD, CFD, futures, sản phẩm đòn bẩy và công cụ tài chính khác có rủi ro đáng kể và có thể gây lỗ vượt vốn ban đầu. Hiệu suất quá khứ không bảo đảm kết quả tương lai."],
        ["Giới hạn dữ liệu", "Dữ liệu thị trường và chỉ báo phát sinh có thể bị trễ, sai, thiếu hoặc không khả dụng. Người dùng phải tự xác minh thông tin trước khi ra quyết định."],
      ],
    },
  },
  en: {
    badgeLegal: "Legal",
    badgeImportant: "Important",
    backHome: "Back to Home",
    updatedLabel: "Last updated",
    updated: "June 2026",
    privacy: {
      title: "Privacy",
      accent: "Policy",
      sections: [
        ["1. Overview", "Dralvo collects the minimum data needed to operate accounts and improve an XAUUSD analysis platform. This includes email addresses submitted by users and account and usage data required for the app."],
        ["2. Information We Collect", "For account and product operations, we collect email address, signup source, signup timestamp, authentication profile data, alert preferences, dashboard settings, and subscription status."],
        ["3. How We Use Data", "We use data to manage account access, communicate product updates, operate dashboard features, secure accounts, and improve Dralvo. We do not sell personal information."],
        ["4. Third-Party Services", "Dralvo may use Supabase for database/authentication, Stripe for billing, email providers for transactional messages, and market-data providers for evidence inputs."],
        ["5. Data Rights", "Users may request access, correction, or deletion of personal data by contacting legal@dralvo.com. We may need to verify identity before acting on certain requests."],
        ["6. Security", "We use reasonable technical and organizational controls for account and product data, including server-side storage, access controls, and environment-separated service keys. No electronic system can be guaranteed completely secure."],
      ],
    },
    terms: {
      title: "Terms of",
      accent: "Service",
      sections: [
        ["1. Acceptance", "By using Dralvo, you agree to these terms. If you do not agree, do not use the website, dashboard, or related services."],
        ["2. Product Scope", "Dralvo provides informational XAUUSD dashboards, evidence context, and analysis tooling. It does not execute trades, manage funds, or act as a broker, investment adviser, or financial planner."],
        ["3. User Responsibility", "You are responsible for your own trading decisions, risk management, account security, and compliance with laws that apply to you."],
        ["4. Accounts and Access", "You are responsible for keeping your sign-in credentials secure. Dralvo may limit, suspend, or revoke access when needed to protect the service, prevent abuse, address terms violations, or comply with legal requirements."],
        ["5. Billing, Trials, and Cancellation", "Pro is billed through Stripe unless another payment method is clearly shown at checkout. Some new Pro subscriptions may include a 3-day trial; if checkout requires a payment method, recurring charges begin when the trial ends unless you cancel first. You may cancel through the billing portal, and Pro access continues until the end of the paid period. Taxes, refunds, and additional payment conditions depend on the information shown at checkout or on the invoice."],
        ["6. Availability", "Market data, evidence, notifications, and dashboards may be delayed, incomplete, or unavailable because of source-data cadence, infrastructure providers, or maintenance. Dralvo aims to show source and freshness status where possible, but does not guarantee uninterrupted or error-free data."],
      ],
    },
    disclaimer: {
      title: "Financial",
      accent: "Disclaimer",
      sections: [
        ["Informational Purposes Only", "Dralvo is for informational purposes only, not financial advice. Nothing on Dralvo should be interpreted as a recommendation to buy, sell, hold, or trade gold, XAUUSD, CFDs, futures, ETFs, crypto, or any other instrument."],
        ["No Investment Advisory Relationship", "Dralvo is not a broker, dealer, investment adviser, commodity trading adviser, or financial planner. Use of Dralvo does not create an advisory relationship."],
        ["Trading Risk", "Trading XAUUSD, CFDs, futures, leveraged products, and other financial instruments involves substantial risk and may result in losses exceeding initial capital. Past performance does not guarantee future results."],
        ["Data Limitations", "Market data and derived indicators may be delayed, inaccurate, incomplete, or unavailable. Users must independently verify information before making decisions."],
      ],
    },
  },
  "pt-BR": {
    badgeLegal: "Legal",
    badgeImportant: "Importante",
    backHome: "Voltar ao início",
    updatedLabel: "Última atualização",
    updated: "Junho de 2026",
    privacy: {
      title: "Privacidade",
      accent: "Dados",
      sections: [
        ["1. Visão geral", "A Dralvo coleta o mínimo de dados necessário para operar contas e melhorar uma plataforma de análise de XAUUSD. Isso inclui emails enviados por usuários e dados de conta e uso necessários ao aplicativo."],
        ["2. Informações coletadas", "Para operação de conta e produto, coletamos email, origem e data de cadastro, dados de autenticação, preferências de alerta, configurações do painel e status de assinatura."],
        ["3. Como usamos dados", "Usamos dados para gerenciar acesso, comunicar atualizações, operar recursos do painel, proteger contas e melhorar a Dralvo. Não vendemos informações pessoais."],
        ["4. Serviços de terceiros", "A Dralvo pode usar Supabase para banco/autenticação, Stripe para cobrança, provedores de email para mensagens transacionais e provedores de dados de mercado para evidências."],
        ["5. Direitos de dados", "Usuários podem solicitar acesso, correção ou exclusão de dados pessoais pelo email legal@dralvo.com. Algumas solicitações podem exigir verificação de identidade."],
        ["6. Segurança", "Usamos controles técnicos e organizacionais razoáveis para dados de conta e produto, incluindo armazenamento server-side, controles de acesso e chaves separadas por ambiente. Nenhum sistema eletrônico é totalmente garantido."],
      ],
    },
    terms: {
      title: "Termos de",
      accent: "Serviço",
      sections: [
        ["1. Aceitação", "Ao usar a Dralvo, você concorda com estes termos. Se não concordar, não use o site, painel ou serviços relacionados."],
        ["2. Escopo do produto", "A Dralvo fornece painéis informativos de XAUUSD, contexto de evidências e ferramentas de análise. Ela não executa trades, gerencia fundos nem atua como corretora, consultora de investimento ou planejadora financeira."],
        ["3. Responsabilidade do usuário", "Você é responsável por suas decisões de trading, gestão de risco, segurança da conta e cumprimento das leis aplicáveis."],
        ["4. Contas e acesso", "Você é responsável por manter suas credenciais seguras. A Dralvo pode limitar, suspender ou revogar acesso quando necessário para proteger o serviço, impedir abuso, tratar violações dos termos ou cumprir exigências legais."],
        ["5. Cobrança, teste e cancelamento", "O Pro é cobrado via Stripe, salvo quando outro método estiver claramente exibido no checkout. Algumas novas assinaturas Pro podem incluir 3 dias de teste; se o checkout exigir forma de pagamento, cobranças recorrentes começam ao fim do teste, salvo cancelamento antes disso. Você pode cancelar pelo portal de cobrança, e o acesso Pro continua até o fim do período pago. Impostos, reembolsos e condições adicionais dependem das informações exibidas no checkout ou na fatura."],
        ["6. Disponibilidade", "Dados de mercado, evidências, notificações e painéis podem estar atrasados, incompletos ou indisponíveis por causa da cadência das fontes, provedores de infraestrutura ou manutenção. A Dralvo procura exibir fonte e frescor quando possível, mas não garante dados ininterruptos ou livres de erro."],
      ],
    },
    disclaimer: {
      title: "Aviso",
      accent: "Financeiro",
      sections: [
        ["Apenas para fins informativos", "A Dralvo é apenas informativa, não aconselhamento financeiro. Nada na Dralvo deve ser interpretado como recomendação para comprar, vender, manter ou negociar ouro, XAUUSD, CFDs, futuros, ETFs, cripto ou qualquer outro instrumento."],
        ["Sem relação de consultoria", "A Dralvo não é corretora, dealer, consultora de investimento, consultora de commodities ou planejadora financeira. O uso da Dralvo não cria relação de consultoria."],
        ["Risco de trading", "Negociar XAUUSD, CFDs, futuros, produtos alavancados e outros instrumentos financeiros envolve risco substancial e pode gerar perdas acima do capital inicial. Desempenho passado não garante resultados futuros."],
        ["Limitações de dados", "Dados de mercado e indicadores derivados podem estar atrasados, incorretos, incompletos ou indisponíveis. Usuários devem verificar informações independentemente antes de decidir."],
      ],
    },
  },
});

export const NOTIFICATION_COPY = withLocaleFallback({
  vi: {
    subjectPrefix: "Cảnh báo Dralvo",
    triggeredTitle: "Cảnh báo đã kích hoạt",
    indicator: "Chỉ báo",
    condition: "Điều kiện",
    currentValue: "Giá trị hiện tại",
    viewDashboard: "Mở dashboard",
    alertId: "Mã cảnh báo",
  },
  en: {
    subjectPrefix: "Dralvo Alert",
    triggeredTitle: "Alert Triggered",
    indicator: "Indicator",
    condition: "Condition",
    currentValue: "Current Value",
    viewDashboard: "View Dashboard",
    alertId: "Alert ID",
  },
  "pt-BR": {
    subjectPrefix: "Alerta Dralvo",
    triggeredTitle: "Alerta acionado",
    indicator: "Indicador",
    condition: "Condição",
    currentValue: "Valor atual",
    viewDashboard: "Ver painel",
    alertId: "ID do alerta",
  },
});

export const DASHBOARD_COPY = withLocaleFallback({
  vi: {
    nav: {
      dashboard: "Hôm nay",
      chart: "Biểu đồ XAUUSD",
      drivers: "Nguồn lực",
      monitors: "Theo dõi",
      replay: "Replay",
      settings: "Cài đặt",
      expand: "Mở rộng thanh bên",
      collapse: "Thu gọn",
      openSidebar: "Mở thanh bên",
      closeSidebar: "Đóng thanh bên",
      switchToLight: "Chuyển sang giao diện sáng",
      switchToDark: "Chuyển sang giao diện tối",
      live: "Đang hoạt động",
    },
    checkout: {
      successTitle: "Pro đã được kích hoạt",
      successBody: "Thanh toán đã hoàn tất và Dralvo đã đồng bộ quyền truy cập Pro cho tài khoản của bạn.",
      syncFailedTitle: "Thanh toán thành công, đồng bộ đang chờ xử lý",
      syncFailedBody: "Stripe đã trả về checkout thành công nhưng Dralvo chưa đồng bộ được trạng thái gói. Vui lòng thử tải lại hoặc liên hệ hỗ trợ nếu quyền Pro chưa mở.",
      missingSessionTitle: "Thiếu phiên checkout",
      missingSessionBody: "Dralvo không nhận được mã phiên Stripe để xác minh thanh toán. Vui lòng mở lại checkout từ trang Pricing.",
    },
    states: {
      supportive: "hỗ trợ",
      confirming: "xác nhận",
      diverging: "phân kỳ",
      mixed: "trái chiều",
      adverse: "bất lợi",
      neutral: "trung lập",
      insufficient_data: "thiếu dữ liệu",
      missing: "thiếu",
      stale: "quá hạn",
    },
    today: {
      eyebrow: "Luận điểm vàng hôm nay",
      loading: "Đang dựng luận điểm từ dữ liệu đã xác minh...",
      unavailable: "Chưa có luận điểm hôm nay",
      coverage: ["Có dữ liệu", "Yêu cầu", "Quá hạn", "Thiếu"],
      changeHeading: "Điều gì sẽ thay đổi luận điểm này",
      relationshipHeading: "Giá so với driver cơ bản",
      methodology: "Phương pháp",
      generated: "tạo lúc",
      disclaimer: "không phải tín hiệu mua/bán",
    },
    timeline: {
      eyebrow: "Điều gì đã đổi",
      title: "Lịch sử luận điểm",
      description:
        "Snapshot hằng ngày cho thấy thay đổi thật của trạng thái, không phải nhiễu trong ngày.",
      loading: "Đang tải lịch sử luận điểm...",
      empty: "Chưa có snapshot lịch sử nào được ghi nhận.",
      emptyDetail:
        "Job hằng ngày sẽ tạo baseline đầu tiên. Dralvo không tự bịa lịch sử cũ.",
      initial: "Luận điểm đầu tiên được ghi nhận",
      changedFrom: "Luận điểm đổi từ",
      held: "Trạng thái luận điểm giữ nguyên",
      noDriverChange: "Không ghi nhận chuyển trạng thái driver.",
      relationshipChanged: "Quan hệ giá",
      relationshipStates: {
        confirming: "xác nhận",
        diverging: "phân kỳ",
        neutral: "chưa rõ hướng",
        insufficient_data: "thiếu dữ liệu",
      },
    },
    drivers: {
      eyebrow: "Nguồn lực bằng chứng",
      title: "Dralvo tạo luận điểm vàng như thế nào",
      description:
        "Mỗi driver bắt đầu bằng một câu hỏi quyết định, nguồn rõ ràng và giới hạn diễn giải.",
      implemented: "Đã triển khai",
      decisionQuestion: "Câu hỏi quyết định",
      interpretation: "Diễn giải",
      limitations: "Giới hạn",
      cadence: "Nhịp cập nhật nguồn",
      requiredSeries: "Chuỗi dữ liệu bắt buộc",
      openSource: "Mở nguồn",
      history: "Lịch sử vị thế",
      managedMoneyNet: "Managed Money net, hợp đồng",
      holdingsHistory: "Lịch sử nắm giữ",
      gldTonnes: "GLD nắm giữ, tấn",
      realYieldHistory: "Lịch sử lợi suất thực",
      tipsPercent: "TIPS 10 năm, %",
      priceHistory: "Lịch sử giá",
      xauusdClose: "XAUUSD đóng cửa, USD/oz",
      percentile: "phân vị trong cửa sổ",
      latest: "Mới nhất",
      weeklyChange: "Thay đổi tuần",
      dailyChange: "Thay đổi ngày",
      dailyYieldChange: "Thay đổi ngày, điểm %",
      dailyPriceChange: "Thay đổi ngày, USD",
      observations: "Quan sát",
      noHistory: "Chưa có đủ lịch sử đã xác minh.",
      limitedHistory: "Free hiển thị 12 quan sát gần nhất.",
      limitedGldHistory: "Free hiển thị 30 quan sát GLD gần nhất.",
      limitedTipsHistory: "Free hiển thị 30 quan sát TIPS gần nhất.",
      limitedXauusdHistory: "Free hiển thị 30 giá đóng cửa gần nhất.",
      unlockHistory: "Mở rộng cửa sổ lịch sử",
      chartLabel: "Lịch sử Managed Money net của CFTC",
      gldChartLabel: "Lịch sử lượng vàng GLD nắm giữ",
      tipsChartLabel: "Lịch sử lợi suất thực TIPS 10 năm",
      xauusdChartLabel: "Lịch sử giá đóng cửa XAUUSD",
      comexHistoryTitle: "Độ sâu lịch sử COMEX",
      comexHistoryDetail:
        "CME chỉ công khai miễn phí báo cáo hiện tại. Lịch sử Registrar yêu cầu CME DataMine; Dralvo đang tích lũy dữ liệu chính thức hằng ngày thay vì dùng nguồn sao chép.",
    },
    replay: {
      eyebrow: "Replay lịch sử",
      title: "Dựng lại luận điểm theo những gì có thể biết lúc đó",
      description:
        "Replay dùng thời điểm công bố nguồn nếu có, nếu không dùng thời điểm Dralvo nhận dữ liệu. Bằng chứng sau cutoff bị loại.",
      proTitle: "Replay lịch sử yêu cầu Pro",
      proDescription:
        "Replay là workflow nghiên cứu và không bao giờ lấp lịch sử thiếu bằng dữ liệu mô phỏng.",
      date: "Ngày replay",
      run: "Chạy replay",
      evidenceCount: "quan sát có thể biết ở thời điểm đó",
    },
    pages: {
      upgrade: "Nâng cấp Pro",
      chartEyebrow: "Biểu đồ XAUUSD",
      chartTitle: "Góc nhìn chỉ huy giá vàng",
      chartDescription:
        "Nến XAUUSD 4H đã xác minh cùng trạng thái nhà cung cấp và tính khả dụng.",
      indicatorsEyebrow: "Bề mặt bằng chứng",
      indicatorsTitle: "Tín hiệu dành riêng cho vàng",
      indicatorsDescription:
        "Kiểm tra snapshot nguồn đã xác minh phía sau luận điểm hiện tại. Free thấy ba thẻ đầu; Pro mở toàn bộ bề mặt bằng chứng.",
      noSnapshots: "Chưa có snapshot đã xác minh",
      noSnapshotsDescription:
        "Dashboard giữ trống cho đến khi ingestion production ghi quan sát nguồn thật.",
      proIndicatorDescription: "Chỉ báo này thuộc Dralvo Pro.",
      correlationEyebrow: "Tương quan",
      correlationTitle: "Nghiên cứu quan hệ giữa các driver",
      correlationDescription:
        "Bề mặt này tiếp tục bị khóa cho đến khi mọi hệ số có thể tái lập từ chuỗi đã xác minh và căn chỉnh.",
      correlationLockedTitle: "Ma trận tương quan đầy đủ",
      correlationLockedDescription:
        "Nâng cấp Pro để mở toàn bộ heatmap cross-asset.",
      alertsEyebrow: "Theo dõi luận điểm",
      alertsTitle: "Biết khi bằng chứng thay đổi",
      alertsDescription:
        "Theo dõi luận điểm tổng thể, trạng thái từng driver hoặc ngưỡng bằng chứng số và nhận giải thích qua in-app, email hoặc Telegram.",
      alertsLockedTitle: "Cảnh báo tùy chỉnh yêu cầu Pro",
      alertsLockedDescription:
        "Free có thể khám phá dashboard. Pro mở theo dõi luận điểm, ngưỡng bằng chứng và gửi thông báo.",
      settingsEyebrow: "Cài đặt",
      settingsTitle: "Tài khoản và thông báo",
      settingsDescription:
        "Quản lý kênh thông báo và billing từ một bảng vận hành.",
      notifications: "Thông báo",
      notificationsLocked:
        "Kênh thông báo khả dụng sau khi nâng cấp Pro.",
      dataStatus: "Trạng thái dữ liệu",
      dataStatusDescription:
        "Ingestion dữ liệu hiện chạy theo cron production đã cấu hình.",
    },
    userMenu: {
      aria: "Menu người dùng",
      free: "Free",
      activeSubscription:
        "Subscription đang hoạt động. Quản lý gia hạn, thẻ hoặc hủy trong Stripe.",
      upgradeDescription:
        "Nâng cấp Pro để mở toàn bộ workflow luận điểm và điều khiển billing.",
      openingBilling: "Đang mở billing...",
      manageBilling: "Quản lý billing",
      upgrade: "Nâng cấp Pro",
      signOut: "Đăng xuất",
      billingError: "Không mở được billing portal.",
    },
  },
  en: {
    nav: {
      dashboard: "Today",
      chart: "XAUUSD Chart",
      drivers: "Drivers",
      monitors: "Monitors",
      replay: "Replay",
      settings: "Settings",
      expand: "Expand sidebar",
      collapse: "Collapse",
      openSidebar: "Open sidebar",
      closeSidebar: "Close sidebar",
      switchToLight: "Switch to light theme",
      switchToDark: "Switch to dark theme",
      live: "Live",
    },
    checkout: {
      successTitle: "Pro is active",
      successBody: "Payment is complete and Dralvo has synced Pro access for your account.",
      syncFailedTitle: "Payment succeeded, sync is pending",
      syncFailedBody: "Stripe returned a successful checkout but Dralvo could not sync the plan status yet. Refresh or contact support if Pro access does not appear.",
      missingSessionTitle: "Checkout session missing",
      missingSessionBody: "Dralvo did not receive the Stripe session id needed to verify payment. Please restart checkout from Pricing.",
    },
    states: {
      supportive: "supportive",
      confirming: "confirming",
      diverging: "diverging",
      mixed: "mixed",
      adverse: "adverse",
      neutral: "neutral",
      insufficient_data: "insufficient data",
      missing: "missing",
      stale: "stale",
    },
    today: {
      eyebrow: "Today's gold thesis",
      loading: "Building thesis from verified evidence...",
      unavailable: "Today thesis unavailable",
      coverage: ["Available", "Required", "Stale", "Missing"],
      changeHeading: "What would change this thesis",
      relationshipHeading: "Price vs fundamentals",
      methodology: "Methodology",
      generated: "generated",
      disclaimer: "not a buy/sell signal",
    },
    timeline: {
      eyebrow: "What changed",
      title: "Thesis history",
      description:
        "Daily snapshots show real state transitions, not intraday noise.",
      loading: "Loading recorded thesis changes...",
      empty: "No historical thesis snapshot has been recorded yet.",
      emptyDetail:
        "The daily thesis job will create the first baseline. Dralvo will not invent earlier history.",
      initial: "Initial recorded thesis",
      changedFrom: "Thesis changed from",
      held: "Thesis state held",
      noDriverChange: "No recorded driver-state transition.",
      relationshipChanged: "Price relationship",
      relationshipStates: {
        confirming: "confirming",
        diverging: "diverging",
        neutral: "not directional",
        insufficient_data: "insufficient data",
      },
    },
    drivers: {
      eyebrow: "Evidence Drivers",
      title: "How Dralvo reaches a gold thesis",
      description:
        "Each driver begins with a decision question, a named source, and an explicit limitation.",
      implemented: "Implemented",
      decisionQuestion: "Decision question",
      interpretation: "Interpretation",
      limitations: "Limitations",
      cadence: "Source cadence",
      requiredSeries: "Required evidence series",
      openSource: "Open source",
      history: "Positioning history",
      managedMoneyNet: "Managed Money net, contracts",
      holdingsHistory: "Holdings history",
      gldTonnes: "GLD holdings, tonnes",
      realYieldHistory: "Real-yield history",
      tipsPercent: "10Y TIPS, %",
      priceHistory: "Price history",
      xauusdClose: "XAUUSD close, USD/oz",
      percentile: "window percentile",
      latest: "Latest",
      weeklyChange: "Weekly change",
      dailyChange: "Daily change",
      dailyYieldChange: "Daily change, pp",
      dailyPriceChange: "Daily change, USD",
      observations: "Observations",
      noHistory: "Not enough verified history yet.",
      limitedHistory: "Free shows the latest 12 observations.",
      limitedGldHistory: "Free shows the latest 30 GLD observations.",
      limitedTipsHistory: "Free shows the latest 30 TIPS observations.",
      limitedXauusdHistory: "Free shows the latest 30 daily closes.",
      unlockHistory: "Extend history window",
      chartLabel: "CFTC Managed Money net history",
      gldChartLabel: "GLD gold holdings history",
      tipsChartLabel: "10Y TIPS real-yield history",
      xauusdChartLabel: "XAUUSD daily close history",
      comexHistoryTitle: "COMEX history depth",
      comexHistoryDetail:
        "CME provides the current report publicly, while historical Registrar data requires CME DataMine. Dralvo is retaining official daily observations rather than using a third-party mirror.",
    },
    replay: {
      eyebrow: "Historical Replay",
      title: "Rebuild the thesis as it was knowable",
      description:
        "Replay uses source release time when available and retrieval time otherwise. Evidence learned after the cutoff is excluded.",
      proTitle: "Historical replay requires Pro",
      proDescription:
        "Replay is a research workflow and never fills missing history with simulated evidence.",
      date: "Replay date",
      run: "Run replay",
      evidenceCount: "historically available observations",
    },
    pages: {
      upgrade: "Upgrade to Pro",
      chartEyebrow: "XAUUSD Chart",
      chartTitle: "Gold price command view",
      chartDescription:
        "Verified XAUUSD 4H bars with explicit provider and availability state.",
      indicatorsEyebrow: "Indicator Surface",
      indicatorsTitle: "Gold-native signals",
      indicatorsDescription:
        "Inspect the verified source snapshots behind the current thesis. Free accounts see the first three available cards; Pro unlocks the full evidence surface.",
      noSnapshots: "No verified snapshots available",
      noSnapshotsDescription:
        "The dashboard remains empty until production ingestion writes real source observations.",
      proIndicatorDescription: "This indicator is part of Dralvo Pro.",
      correlationEyebrow: "Correlation",
      correlationTitle: "Cross-driver relationship research",
      correlationDescription:
        "This surface remains gated until every coefficient is reproducible from aligned verified series.",
      correlationLockedTitle: "Full correlation matrix",
      correlationLockedDescription:
        "Upgrade to Pro to unlock the complete cross-asset heatmap.",
      alertsEyebrow: "Thesis Monitors",
      alertsTitle: "Know when the evidence changes",
      alertsDescription:
        "Monitor the overall thesis, individual driver states, or numeric evidence thresholds and receive an explanation through in-app, email, or Telegram notifications.",
      alertsLockedTitle: "Custom alerts require Pro",
      alertsLockedDescription:
        "Free accounts can explore the dashboard. Pro unlocks thesis monitors, evidence thresholds, and notification delivery.",
      settingsEyebrow: "Settings",
      settingsTitle: "Account and notification settings",
      settingsDescription:
        "Manage your notification channels and billing flow from one operational panel.",
      notifications: "Notifications",
      notificationsLocked:
        "Notification channels become available after upgrading to Pro.",
      dataStatus: "Data status",
      dataStatusDescription:
        "Data ingestion currently follows the configured production cron cadence.",
    },
    userMenu: {
      aria: "User menu",
      free: "Free",
      activeSubscription:
        "Subscription is active. Manage renewal, card, or cancellation in Stripe.",
      upgradeDescription:
        "Upgrade to Pro to unlock the complete thesis workflow and billing controls.",
      openingBilling: "Opening billing...",
      manageBilling: "Manage billing",
      upgrade: "Upgrade to Pro",
      signOut: "Sign Out",
      billingError: "Failed to open billing portal.",
    },
  },
  "pt-BR": {
    nav: {
      dashboard: "Hoje",
      chart: "Gráfico XAUUSD",
      drivers: "Drivers",
      monitors: "Monitores",
      replay: "Replay",
      settings: "Configurações",
      expand: "Expandir barra lateral",
      collapse: "Recolher",
      openSidebar: "Abrir barra lateral",
      closeSidebar: "Fechar barra lateral",
      switchToLight: "Mudar para tema claro",
      switchToDark: "Mudar para tema escuro",
      live: "Ao vivo",
    },
    checkout: {
      successTitle: "Pro está ativo",
      successBody: "O pagamento foi concluído e a Dralvo sincronizou o acesso Pro da sua conta.",
      syncFailedTitle: "Pagamento aprovado, sincronização pendente",
      syncFailedBody: "O Stripe retornou checkout bem-sucedido, mas a Dralvo ainda não conseguiu sincronizar o plano. Atualize a página ou contate suporte se o acesso Pro não aparecer.",
      missingSessionTitle: "Sessão de checkout ausente",
      missingSessionBody: "A Dralvo não recebeu o id da sessão Stripe necessário para verificar o pagamento. Reinicie o checkout pela página Pricing.",
    },
    states: {
      supportive: "favorável",
      confirming: "confirmação",
      diverging: "divergência",
      mixed: "misto",
      adverse: "adverso",
      neutral: "neutro",
      insufficient_data: "dados insuficientes",
      missing: "ausente",
      stale: "desatualizado",
    },
    today: {
      eyebrow: "Tese de ouro de hoje",
      loading: "Construindo a tese com evidências verificadas...",
      unavailable: "Tese de hoje indisponível",
      coverage: ["Disponível", "Obrigatório", "Desatualizado", "Ausente"],
      changeHeading: "O que mudaria esta tese",
      relationshipHeading: "Preço vs fundamentos",
      methodology: "Metodologia",
      generated: "gerada",
      disclaimer: "não é sinal de compra/venda",
    },
    timeline: {
      eyebrow: "O que mudou",
      title: "Histórico da tese",
      description:
        "Snapshots diários mostram transições reais de estado, não ruído intradiário.",
      loading: "Carregando mudanças registradas...",
      empty: "Nenhum snapshot histórico foi registrado ainda.",
      emptyDetail:
        "O job diário criará a primeira linha de base. A Dralvo não inventa histórico.",
      initial: "Primeira tese registrada",
      changedFrom: "Tese mudou de",
      held: "Estado da tese mantido",
      noDriverChange: "Nenhuma transição de driver registrada.",
      relationshipChanged: "Relação de preço",
      relationshipStates: {
        confirming: "confirmação",
        diverging: "divergência",
        neutral: "sem direção",
        insufficient_data: "dados insuficientes",
      },
    },
    drivers: {
      eyebrow: "Drivers de evidência",
      title: "Como a Dralvo chega a uma tese de ouro",
      description:
        "Cada driver começa com uma pergunta de decisão, uma fonte nomeada e uma limitação explícita.",
      implemented: "Implementado",
      decisionQuestion: "Pergunta de decisão",
      interpretation: "Interpretação",
      limitations: "Limitações",
      cadence: "Cadência da fonte",
      requiredSeries: "Séries de evidência obrigatórias",
      openSource: "Abrir fonte",
      history: "Histórico de posicionamento",
      managedMoneyNet: "Managed Money líquido, contratos",
      holdingsHistory: "Histórico de participações",
      gldTonnes: "Participações do GLD, toneladas",
      realYieldHistory: "Histórico de juros reais",
      tipsPercent: "TIPS de 10 anos, %",
      priceHistory: "Histórico de preços",
      xauusdClose: "Fechamento XAUUSD, USD/oz",
      percentile: "percentil da janela",
      latest: "Mais recente",
      weeklyChange: "Variação semanal",
      dailyChange: "Variação diária",
      dailyYieldChange: "Variação diária, p.p.",
      dailyPriceChange: "Variação diária, USD",
      observations: "Observações",
      noHistory: "Ainda não há histórico verificado suficiente.",
      limitedHistory: "O Free mostra as 12 observações mais recentes.",
      limitedGldHistory: "O Free mostra as 30 observações mais recentes do GLD.",
      limitedTipsHistory: "O Free mostra as 30 observações mais recentes do TIPS.",
      limitedXauusdHistory: "O Free mostra os 30 fechamentos diários mais recentes.",
      unlockHistory: "Ampliar janela histórica",
      chartLabel: "Histórico líquido de Managed Money da CFTC",
      gldChartLabel: "Histórico de participações em ouro do GLD",
      tipsChartLabel: "Histórico de juros reais do TIPS de 10 anos",
      xauusdChartLabel: "Histórico de fechamento diário do XAUUSD",
      comexHistoryTitle: "Profundidade histórica da COMEX",
      comexHistoryDetail:
        "A CME disponibiliza publicamente o relatório atual, enquanto o histórico do Registrar exige o CME DataMine. A Dralvo está retendo observações oficiais diárias em vez de usar um espelho de terceiros.",
    },
    replay: {
      eyebrow: "Replay histórico",
      title: "Reconstrua a tese como ela era conhecível",
      description:
        "O replay usa o horário de divulgação quando disponível e o horário de coleta caso contrário. Evidências após o corte são excluídas.",
      proTitle: "Replay histórico exige Pro",
      proDescription:
        "Replay é um fluxo de pesquisa e nunca preenche histórico ausente com evidência simulada.",
      date: "Data do replay",
      run: "Executar replay",
      evidenceCount: "observações historicamente disponíveis",
    },
    pages: {
      upgrade: "Atualizar para Pro",
      chartEyebrow: "Gráfico XAUUSD",
      chartTitle: "Visão operacional do preço do ouro",
      chartDescription:
        "Barras XAUUSD 4H verificadas com estado explícito do provedor e disponibilidade.",
      indicatorsEyebrow: "Superfície de evidências",
      indicatorsTitle: "Sinais nativos de ouro",
      indicatorsDescription:
        "Inspecione snapshots verificados por trás da tese atual. Free mostra os três primeiros cards; Pro libera toda a superfície de evidências.",
      noSnapshots: "Nenhum snapshot verificado disponível",
      noSnapshotsDescription:
        "O painel permanece vazio até a ingestão de produção gravar observações reais de fontes.",
      proIndicatorDescription: "Este indicador faz parte do Dralvo Pro.",
      correlationEyebrow: "Correlação",
      correlationTitle: "Pesquisa de relação entre drivers",
      correlationDescription:
        "Esta superfície continua bloqueada até que cada coeficiente seja reproduzível a partir de séries verificadas e alinhadas.",
      correlationLockedTitle: "Matriz de correlação completa",
      correlationLockedDescription:
        "Atualize para Pro para liberar todo o heatmap cross-asset.",
      alertsEyebrow: "Monitores da tese",
      alertsTitle: "Saiba quando a evidência muda",
      alertsDescription:
        "Monitore a tese geral, estados de drivers ou limites numéricos de evidência e receba explicações por in-app, email ou Telegram.",
      alertsLockedTitle: "Alertas personalizados exigem Pro",
      alertsLockedDescription:
        "Contas Free podem explorar o painel. Pro libera monitores de tese, limites de evidência e envio de notificações.",
      settingsEyebrow: "Configurações",
      settingsTitle: "Conta e notificações",
      settingsDescription:
        "Gerencie canais de notificação e billing em um painel operacional.",
      notifications: "Notificações",
      notificationsLocked:
        "Canais de notificação ficam disponíveis após atualizar para Pro.",
      dataStatus: "Estado dos dados",
      dataStatusDescription:
        "A ingestão de dados segue a cadência de cron de produção configurada.",
    },
    userMenu: {
      aria: "Menu do usuário",
      free: "Free",
      activeSubscription:
        "Assinatura ativa. Gerencie renovação, cartão ou cancelamento no Stripe.",
      upgradeDescription:
        "Atualize para Pro para liberar o fluxo completo de tese e controles de billing.",
      openingBilling: "Abrindo billing...",
      manageBilling: "Gerenciar billing",
      upgrade: "Atualizar para Pro",
      signOut: "Sair",
      billingError: "Não foi possível abrir o portal de billing.",
    },
  },
});
