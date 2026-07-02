import type { Metadata } from "next";
import Link from "next/link";

import { BrandLink } from "@/components/shared/brand";
import { NavBar } from "@/components/shared/nav-bar";
import { MainNavActions } from "@/components/shared/site-nav";
import { mainNavLinks } from "@/components/shared/nav-links";
import { InstallAppButton } from "@/components/shared/install-app-button";
import { SocialLinks } from "@/components/shared/social-links";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { getServerLocale } from "@/lib/server-locale";
import { localeDir, withLocaleFallback } from "@/lib/i18n";
import { COMMON_COPY } from "@/lib/common-copy";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";
const SERIF = "'DM Serif Display', 'Times New Roman', 'Noto Serif', serif";

type Accent = "gold" | "steel" | "green";
const ACCENT: Record<Accent, string> = { gold: "var(--gold-bright)", steel: "#7dc0f0", green: "#00c98d" };

const COPY = withLocaleFallback({
  "pt-BR": {
    badge: "Metodologia",
    title: "Estratégia real. Verificação real.",
    intro:
      "Os robôs Dralvo são construídos sobre regras claras de gestão de risco e verificados em dados reais de mercado — sem martingale, sem grid, com stop-loss rígido em cada operação.",
    principlesTitle: "As regras que todo robô Dralvo segue",
    principles: [
      ["Stop-loss rígido em cada operação", "Cada entrada tem um stop-loss predefinido. Nunca seguramos posições perdedoras nem movemos o stop contra nós."],
      ["Sem martingale, sem grid", "Nunca dobramos a posição após uma perda nem fazemos preço médio. O risco por operação permanece constante."],
      ["Verificado em dados reais", "Backtest em dados 100% real tick ao longo de anos, com o drawdown e a maior sequência de perdas divulgados."],
      ["Expectativas transparentes", "Taxa de acerto, profit factor e drawdown máximo são divulgados — o bom e o ruim, sem maquiagem."],
    ],
    strategiesTitle: "Como cada robô decide",
    strategies: [
      { name: "GoldMaster", tf: "D1 · Swing", accent: "gold" as Accent, d: "Um sistema swing seguidor de tendência no gráfico diário. Somente compra (long-only), usando o posicionamento CFTC Commitment of Traders como filtro; pode permanecer fora do mercado por longos períodos quando o ouro está fraco, para preservar o capital." },
      { name: "GoldScalp", tf: "M15 · Momentum", accent: "steel" as Accent, d: "Um scalper de momentum em M15. Cada operação tem stop-loss rígido e time-stop. Sem grid, sem martingale." },
      { name: "TiGold", tf: "Free · Adaptive", accent: "green" as Accent, d: "Um robô adaptativo e gratuito para XAUUSD via a parceria IB. Os mesmos princípios de gestão de risco, feito para iniciantes." },
    ],
    processTitle: "Como construímos e verificamos",
    process: [
      ["01", "Projetar a lógica", "Construir regras de entrada/saída a partir de tendência, momentum e filtros de posicionamento — evitando overfitting."],
      ["02", "Backtest em real tick", "Rodar o MT5 Strategy Tester em dados 100% real tick ao longo de anos (até 20 anos no GoldMaster)."],
      ["03", "Medir o risco", "Avaliar drawdown máximo, maior sequência de perdas, profit factor e Sharpe — não apenas o lucro."],
      ["04", "Forward-test", "Rodar demo/forward para confirmar que o comportamento ao vivo corresponde ao backtest antes do lançamento."],
      ["05", "Atualizar com transparência", "Monitorar, atualizar o EA e divulgar os resultados na página de Track Record."],
    ],
    limitsTitle: "O que a Dralvo NÃO faz",
    limits: [
      "Prometer retornos fixos ou “lucro diário constante”.",
      "Usar martingale/grid para ocultar o risco de estourar a conta.",
      "Vender sinais “com ganho garantido” ou gerir o seu dinheiro.",
      "Tratar resultados de backtest como garantia do futuro.",
      "Fornecer aconselhamento financeiro — a informação é apenas para referência.",
    ],
    faqTitle: "Perguntas frequentes",
    faq: [
      ["Os robôs Dralvo usam martingale?", "Não. Nenhum robô Dralvo usa martingale ou grid. Cada operação tem stop-loss rígido e o risco por operação permanece constante."],
      ["Como os EAs da Dralvo são verificados?", "Eles passam por backtest em dados 100% real tick ao longo de anos com o MT5 Strategy Tester, com o drawdown máximo e a maior sequência de perdas divulgados, e depois por forward-test antes do lançamento."],
      ["Os resultados de backtest garantem lucro?", "Não. O desempenho passado não garante resultados futuros. A informação é apenas para referência e não constitui aconselhamento financeiro."],
      ["Qual a diferença entre o GoldMaster e o GoldScalp?", "O GoldMaster é um sistema swing seguidor de tendência em D1 que usa um filtro de posicionamento CFTC. O GoldScalp é um scalper de momentum em M15 com stop-loss rígido e time-stop."],
      ["De quanto capital preciso para começar?", "Depende do robô e da corretora. Comece em uma conta demo e depois use capital pequeno assim que entender o risco. O TiGold é gratuito via a parceria IB."],
    ],
    trackTitle: "Veja os números reais, sem maquiagem.",
    trackBody: "O backtest completo e as expectativas honestas (taxa de acerto, drawdown, maior sequência de perdas) são divulgados abertamente.",
    trackBtn: "Ver Track Record",
    primaryCta: "Comece de graça",
    home: "Início",
  },
  es: {
    badge: "Metodología",
    title: "Estrategia real. Verificación real.",
    intro:
      "Los robots de Dralvo se construyen sobre reglas claras de gestión de riesgo y se verifican con datos reales de mercado: sin martingale, sin grid, con un stop-loss fijo en cada operación.",
    principlesTitle: "Las reglas que sigue cada robot de Dralvo",
    principles: [
      ["Stop-loss fijo en cada operación", "Cada entrada tiene un stop-loss predefinido. Nunca mantenemos posiciones perdedoras ni movemos el stop en nuestra contra."],
      ["Sin martingale, sin grid", "Nunca duplicamos la posición tras una pérdida ni promediamos a la baja. El riesgo por operación se mantiene constante."],
      ["Verificado con datos reales", "Backtest sobre datos de tick 100 % reales a lo largo de años, con el drawdown y la racha perdedora más larga publicados."],
      ["Expectativas transparentes", "Se publican la tasa de acierto, el profit factor y el drawdown máximo: lo bueno y lo malo, sin adornos."],
    ],
    strategiesTitle: "Cómo decide cada robot",
    strategies: [
      { name: "GoldMaster", tf: "D1 · Swing", accent: "gold" as Accent, d: "Un sistema swing de seguimiento de tendencia en marco temporal diario. Solo posiciones largas (long-only), que utiliza el posicionamiento del Commitment of Traders de la CFTC como filtro; puede permanecer inactivo durante largos periodos cuando el oro está débil para preservar el capital." },
      { name: "GoldScalp", tf: "M15 · Momentum", accent: "steel" as Accent, d: "Un scalper de momentum en M15. Cada operación tiene un stop-loss fijo y un time-stop. Sin grid, sin martingale." },
      { name: "TiGold", tf: "Free · Adaptativo", accent: "green" as Accent, d: "Un robot XAUUSD adaptativo y gratuito a través de la alianza IB. Los mismos principios de gestión de riesgo, diseñado para principiantes." },
    ],
    processTitle: "Cómo construimos y verificamos",
    process: [
      ["01", "Diseñar la lógica", "Construir las reglas de entrada y salida a partir de filtros de tendencia, momentum y posicionamiento, evitando el sobreajuste."],
      ["02", "Backtest con tick real", "Ejecutar el MT5 Strategy Tester sobre datos de tick 100 % reales a lo largo de años (hasta 20 en el caso de GoldMaster)."],
      ["03", "Medir el riesgo", "Evaluar el drawdown máximo, la racha perdedora más larga, el profit factor y el Sharpe, no solo el beneficio."],
      ["04", "Forward-test", "Ejecutar en demo/forward para confirmar que el comportamiento en vivo coincide con el backtest antes de la publicación."],
      ["05", "Actualizar con transparencia", "Supervisar, actualizar el EA y publicar los resultados en la página de Track Record."],
    ],
    limitsTitle: "Lo que Dralvo NO hace",
    limits: [
      "Prometer rendimientos fijos o un “beneficio diario constante”.",
      "Usar martingale/grid para ocultar el riesgo de reventar la cuenta.",
      "Vender señales de “ganancia garantizada” ni gestionar su dinero.",
      "Tratar los resultados del backtest como una garantía del futuro.",
      "Ofrecer asesoramiento financiero: la información es solo de carácter orientativo.",
    ],
    faqTitle: "Preguntas frecuentes",
    faq: [
      ["¿Los robots de Dralvo utilizan martingale?", "No. Ningún robot de Dralvo utiliza martingale ni grid. Cada operación tiene un stop-loss fijo y el riesgo por operación se mantiene constante."],
      ["¿Cómo se verifican los EA de Dralvo?", "Se someten a backtest sobre datos de tick 100 % reales a lo largo de años con el MT5 Strategy Tester, con el drawdown máximo y la racha perdedora más larga publicados, y después se realiza un forward-test antes de la publicación."],
      ["¿Los resultados del backtest garantizan beneficios?", "No. El rendimiento pasado no garantiza resultados futuros. La información es solo de carácter orientativo y no constituye asesoramiento financiero."],
      ["¿En qué se diferencia GoldMaster de GoldScalp?", "GoldMaster es un sistema swing de seguimiento de tendencia en D1 que utiliza un filtro de posicionamiento de la CFTC. GoldScalp es un scalper de momentum en M15 con un stop-loss fijo y un time-stop."],
      ["¿Cuánto capital necesito para empezar?", "Depende del robot y del bróker. Comience con una cuenta demo y después utilice un capital reducido una vez que comprenda el riesgo. TiGold es gratuito a través de la alianza IB."],
    ],
    trackTitle: "Vea las cifras reales, sin adornos.",
    trackBody: "El backtest completo y las expectativas honestas (tasa de acierto, drawdown, racha perdedora más larga) se publican de forma abierta.",
    trackBtn: "Ver Track Record",
    primaryCta: "Empezar gratis",
    home: "Inicio",
  },
  id: {
    badge: "Metodologi",
    title: "Strategi nyata. Verifikasi nyata.",
    intro:
      "Robot Dralvo dibangun di atas aturan manajemen risiko yang jelas dan diverifikasi pada data pasar riil — tanpa martingale, tanpa grid, dengan stop-loss tetap pada setiap transaksi.",
    principlesTitle: "Aturan yang dipatuhi setiap robot Dralvo",
    principles: [
      ["Stop-loss tetap pada setiap transaksi", "Setiap posisi masuk memiliki stop-loss yang ditetapkan sebelumnya. Kami tidak pernah menahan posisi rugi atau menggeser stop ke arah yang merugikan."],
      ["Tanpa martingale, tanpa grid", "Kami tidak pernah menggandakan posisi setelah kerugian atau merata-ratakan posisi. Risiko per transaksi tetap konstan."],
      ["Diverifikasi pada data riil", "Diuji ulang (backtest) pada data 100% tick riil selama bertahun-tahun, dengan drawdown dan rangkaian kerugian terpanjang yang dipublikasikan."],
      ["Ekspektasi yang transparan", "Win-rate, profit factor, dan drawdown maksimum dipublikasikan — baik yang menguntungkan maupun yang merugikan, tanpa dibuat-buat."],
    ],
    strategiesTitle: "Cara setiap robot mengambil keputusan",
    strategies: [
      { name: "GoldMaster", tf: "D1 · Swing", accent: "gold" as Accent, d: "Sistem swing mengikuti tren pada kerangka waktu harian. Long-only, menggunakan posisi CFTC Commitment of Traders sebagai filter; sistem ini dapat tidak beroperasi dalam waktu lama ketika emas melemah demi menjaga modal." },
      { name: "GoldScalp", tf: "M15 · Momentum", accent: "steel" as Accent, d: "Scalper momentum pada kerangka waktu M15. Setiap transaksi memiliki stop-loss tetap dan time-stop. Tanpa grid, tanpa martingale." },
      { name: "TiGold", tf: "Free · Adaptive", accent: "green" as Accent, d: "Robot XAUUSD adaptif gratis melalui kemitraan IB. Prinsip manajemen risiko yang sama, dirancang untuk pemula." },
    ],
    processTitle: "Cara kami membangun & memverifikasi",
    process: [
      ["01", "Merancang logika", "Membangun aturan masuk/keluar dari filter tren, momentum, dan posisi — dengan menghindari overfitting."],
      ["02", "Backtest tick riil", "Menjalankan MT5 Strategy Tester pada data 100% tick riil selama bertahun-tahun (hingga 20 tahun untuk GoldMaster)."],
      ["03", "Mengukur risiko", "Menilai drawdown maksimum, rangkaian kerugian terpanjang, profit factor, dan Sharpe — bukan hanya keuntungan."],
      ["04", "Forward-test", "Menjalankan demo/forward untuk memastikan perilaku live sesuai dengan backtest sebelum dirilis."],
      ["05", "Memperbarui secara transparan", "Memantau, memperbarui EA, dan mempublikasikan hasil pada halaman Track Record."],
    ],
    limitsTitle: "Yang TIDAK dilakukan Dralvo",
    limits: [
      "Menjanjikan imbal hasil tetap atau “keuntungan harian yang stabil”.",
      "Menggunakan martingale/grid untuk menyembunyikan risiko kebangkrutan akun.",
      "Menjual sinyal “pasti menang” atau mengelola dana Anda.",
      "Menganggap hasil backtest sebagai jaminan masa depan.",
      "Memberikan nasihat keuangan — informasi hanya bersifat sebagai referensi.",
    ],
    faqTitle: "Pertanyaan yang sering diajukan",
    faq: [
      ["Apakah robot Dralvo menggunakan martingale?", "Tidak. Tidak ada robot Dralvo yang menggunakan martingale atau grid. Setiap transaksi memiliki stop-loss tetap dan risiko per transaksi tetap konstan."],
      ["Bagaimana EA Dralvo diverifikasi?", "EA diuji ulang (backtest) pada data 100% tick riil selama bertahun-tahun dengan MT5 Strategy Tester, dengan drawdown maksimum dan rangkaian kerugian terpanjang yang dipublikasikan, kemudian diuji forward sebelum dirilis."],
      ["Apakah hasil backtest menjamin keuntungan?", "Tidak. Kinerja masa lalu tidak menjamin hasil di masa depan. Informasi ini hanya bersifat sebagai referensi dan bukan merupakan nasihat keuangan."],
      ["Apa perbedaan GoldMaster dengan GoldScalp?", "GoldMaster adalah sistem swing mengikuti tren D1 yang menggunakan filter posisi CFTC. GoldScalp adalah scalper momentum M15 dengan stop-loss tetap dan time-stop."],
      ["Berapa modal yang saya butuhkan untuk memulai?", "Tergantung pada robot dan broker. Mulailah dengan akun demo, lalu gunakan modal kecil setelah Anda memahami risikonya. TiGold gratis melalui kemitraan IB."],
    ],
    trackTitle: "Lihat angka yang sebenarnya, tanpa dibuat-buat.",
    trackBody: "Seluruh backtest dan ekspektasi yang jujur (win-rate, drawdown, rangkaian kerugian terpanjang) dipublikasikan secara terbuka.",
    trackBtn: "Lihat Track Record",
    primaryCta: "Mulai gratis",
    home: "Beranda",
  },
  ar: {
    badge: "المنهجية",
    title: "استراتيجية حقيقية. تحقّق حقيقي.",
    intro:
      "تُبنى روبوتات Dralvo على قواعد واضحة لإدارة المخاطر ويُتحقَّق منها على بيانات سوق حقيقية — بلا martingale، بلا grid، ومع وقف خسارة صارم على كل صفقة.",
    principlesTitle: "القواعد التي يلتزم بها كل روبوت من Dralvo",
    principles: [
      ["وقف خسارة صارم على كل صفقة", "لكل صفقة دخول وقف خسارة محدَّد مسبقًا. لا نحتفظ بالصفقات الخاسرة ولا نحرّك الوقف عكس مصلحتنا."],
      ["بلا martingale، بلا grid", "لا نضاعف الحجم بعد الخسارة ولا نُوسّط مركزًا. تبقى المخاطرة لكل صفقة ثابتة."],
      ["مُتحقَّق منه على بيانات حقيقية", "خضع للاختبار الرجعي على بيانات 100% real-tick على مدى سنوات، مع نشر التراجع (drawdown) وأطول سلسلة خسائر."],
      ["توقّعات شفّافة", "تُنشر نسبة الربح ومعامل الربح والحد الأقصى للتراجع — الجيّد والسيّئ، دون تجميل."],
    ],
    strategiesTitle: "كيف يتّخذ كل روبوت قراراته",
    strategies: [
      { name: "GoldMaster", tf: "D1 · Swing", accent: "gold" as Accent, d: "نظام swing يتّبع الاتجاه على الإطار الزمني اليومي. شراء فقط (long-only)، مع استخدام تموضع CFTC Commitment of Traders كمُرشِّح؛ ويمكنه البقاء خاملًا لفترات طويلة عندما يكون الذهب ضعيفًا للحفاظ على رأس المال." },
      { name: "GoldScalp", tf: "M15 · Momentum", accent: "steel" as Accent, d: "مُضارب سريع بالزخم على إطار M15. لكل صفقة وقف خسارة صارم ووقف زمني (time-stop). بلا grid، بلا martingale." },
      { name: "TiGold", tf: "Free · Adaptive", accent: "green" as Accent, d: "روبوت XAUUSD تكيّفي مجاني عبر شراكة IB. المبادئ ذاتها في إدارة المخاطر، مصمَّم للمبتدئين." },
    ],
    processTitle: "كيف نبني ونتحقّق",
    process: [
      ["01", "تصميم المنطق", "بناء قواعد الدخول/الخروج انطلاقًا من الاتجاه والزخم ومُرشِّحات التموضع — مع تجنّب الإفراط في المطابقة (overfitting)."],
      ["02", "اختبار رجعي بـ real-tick", "تشغيل MT5 Strategy Tester على بيانات 100% real-tick على مدى سنوات (حتى 20 عامًا لـ GoldMaster)."],
      ["03", "قياس المخاطر", "تقييم الحد الأقصى للتراجع وأطول سلسلة خسائر ومعامل الربح ونسبة Sharpe — لا الربح وحده."],
      ["04", "الاختبار المستقبلي", "تشغيل حساب demo/forward للتأكّد من مطابقة السلوك الحيّ للاختبار الرجعي قبل الإصدار."],
      ["05", "التحديث بشفافية", "المتابعة وتحديث الـ EA ونشر النتائج على صفحة Track Record."],
    ],
    limitsTitle: "ما لا تفعله Dralvo",
    limits: [
      "الوعد بعوائد ثابتة أو “ربح يومي منتظم”.",
      "استخدام martingale/grid لإخفاء مخاطر تفجّر الحساب.",
      "بيع إشارات “مضمونة الربح” أو إدارة أموالك.",
      "اعتبار نتائج الاختبار الرجعي ضمانًا للمستقبل.",
      "تقديم نصيحة مالية — المعلومات لأغراض مرجعية فقط.",
    ],
    faqTitle: "الأسئلة الشائعة",
    faq: [
      ["هل تستخدم روبوتات Dralvo أسلوب martingale؟", "لا. لا يستخدم أيّ روبوت من Dralvo أسلوب martingale أو grid. لكل صفقة وقف خسارة صارم وتبقى المخاطرة لكل صفقة ثابتة."],
      ["كيف يُتحقَّق من EAs الخاصة بـ Dralvo؟", "تخضع لاختبار رجعي على بيانات 100% real-tick على مدى سنوات باستخدام MT5 Strategy Tester، مع نشر الحد الأقصى للتراجع وأطول سلسلة خسائر، ثم لاختبار مستقبلي قبل الإصدار."],
      ["هل تضمن نتائج الاختبار الرجعي تحقيق الربح؟", "لا. الأداء السابق لا يضمن النتائج المستقبلية. المعلومات لأغراض مرجعية فقط وليست نصيحة مالية."],
      ["ما الفرق بين GoldMaster وGoldScalp؟", "GoldMaster نظام swing يتّبع الاتجاه على الإطار D1 ويستخدم مُرشِّح تموضع CFTC. أمّا GoldScalp فهو مُضارب سريع بالزخم على الإطار M15 مع وقف خسارة صارم ووقف زمني."],
      ["كم رأس المال الذي أحتاجه للبدء؟", "يعتمد ذلك على الروبوت والوسيط. ابدأ بحساب demo، ثم استخدم رأس مال صغير بعد أن تفهم المخاطرة. TiGold مجاني عبر شراكة IB."],
    ],
    trackTitle: "شاهد الأرقام الحقيقية، دون تجميل.",
    trackBody: "يُنشر الاختبار الرجعي الكامل والتوقّعات الصادقة (نسبة الربح، التراجع، أطول سلسلة خسائر) بشكل علني.",
    trackBtn: "عرض Track Record",
    primaryCta: "ابدأ مجانًا",
    home: "الرئيسية",
  },
  vi: {
    badge: "Phương pháp",
    title: "Chiến lược thật, kiểm chứng thật.",
    intro:
      "Robot Dralvo được xây trên nguyên tắc quản trị rủi ro rõ ràng và kiểm chứng trên dữ liệu thị trường thật — không martingale, không grid, mỗi lệnh đều có cắt lỗ cứng.",
    principlesTitle: "Nguyên tắc mọi robot Dralvo tuân thủ",
    principles: [
      ["Cắt lỗ cứng mọi lệnh", "Mỗi lệnh vào đều có stop-loss xác định trước. Không gồng lỗ, không dời SL theo hướng bất lợi."],
      ["Không martingale, không grid", "Không nhân khối lượng sau khi thua, không rải lệnh trung bình giá. Rủi ro mỗi lệnh giữ nguyên."],
      ["Kiểm chứng dữ liệu thật", "Backtest trên dữ liệu tick thật (100% real tick) nhiều năm, công khai drawdown và chuỗi thua dài nhất."],
      ["Minh bạch kỳ vọng", "Công khai win-rate, profit factor, drawdown tối đa — cả điểm tốt lẫn điểm xấu, không tô vẽ."],
    ],
    strategiesTitle: "Cách từng robot ra quyết định",
    strategies: [
      { name: "GoldMaster", tf: "D1 · Swing", accent: "gold" as Accent, d: "Hệ thống swing theo xu hướng khung ngày. Chỉ mua (long-only), dùng vị thế CFTC Commitment of Traders làm bộ lọc; có thể đứng ngoài dài khi vàng yếu để bảo toàn vốn." },
      { name: "GoldScalp", tf: "M15 · Momentum", accent: "steel" as Accent, d: "Scalper theo động lượng khung M15. Mỗi lệnh có cắt lỗ cứng và time-stop (thoát theo thời gian). Không grid, không martingale." },
      { name: "TiGold", tf: "Miễn phí · Adaptive", accent: "green" as Accent, d: "Robot XAUUSD thích ứng, miễn phí qua đối tác IB. Cùng nguyên tắc quản trị rủi ro, phù hợp người mới bắt đầu." },
    ],
    processTitle: "Quy trình xây & kiểm chứng",
    process: [
      ["01", "Thiết kế logic", "Xây quy tắc vào/ra dựa trên xu hướng, động lượng và bộ lọc vị thế — tránh tối ưu quá khớp (overfit)."],
      ["02", "Backtest tick thật", "Chạy MT5 Strategy Tester trên dữ liệu 100% real tick nhiều năm (tới 20 năm với GoldMaster)."],
      ["03", "Đo rủi ro", "Đánh giá drawdown tối đa, chuỗi thua dài nhất, profit factor, Sharpe — không chỉ nhìn lợi nhuận."],
      ["04", "Kiểm định forward", "Chạy demo/forward để xác nhận hành vi khớp backtest trước khi phát hành."],
      ["05", "Cập nhật minh bạch", "Theo dõi, cập nhật EA và công khai kết quả tại trang Track Record."],
    ],
    limitsTitle: "Dralvo KHÔNG làm gì",
    limits: [
      "Không hứa lợi nhuận cố định hay “lãi đều mỗi ngày”.",
      "Không dùng martingale/grid để che giấu rủi ro cháy tài khoản.",
      "Không bán tín hiệu “chắc thắng” hay quản lý tiền hộ bạn.",
      "Không coi kết quả backtest là bảo đảm cho tương lai.",
      "Không đưa lời khuyên đầu tư — thông tin chỉ mang tính tham khảo.",
    ],
    faqTitle: "Câu hỏi thường gặp",
    faq: [
      ["Robot Dralvo có dùng martingale không?", "Không. Không robot nào của Dralvo dùng martingale hay grid. Mỗi lệnh đều có cắt lỗ cứng và rủi ro mỗi lệnh giữ nguyên."],
      ["EA của Dralvo được kiểm chứng thế nào?", "Backtest trên dữ liệu tick thật (100% real tick) nhiều năm bằng MT5 Strategy Tester, công khai drawdown tối đa và chuỗi thua dài nhất, sau đó forward-test trước khi phát hành."],
      ["Kết quả backtest có bảo đảm lợi nhuận không?", "Không. Hiệu suất quá khứ không bảo đảm kết quả tương lai. Thông tin chỉ mang tính tham khảo, không phải lời khuyên đầu tư."],
      ["GoldMaster khác GoldScalp thế nào?", "GoldMaster là hệ thống swing khung D1 theo xu hướng, dùng lọc vị thế CFTC. GoldScalp là scalper khung M15 theo động lượng, có cắt lỗ cứng và time-stop."],
      ["Cần vốn bao nhiêu để bắt đầu?", "Tùy robot và broker. Nên bắt đầu bằng tài khoản demo, rồi dùng vốn nhỏ khi đã hiểu rủi ro. TiGold miễn phí qua IB là cách bắt đầu không tốn phí."],
    ],
    trackTitle: "Xem số liệu thật, không tô vẽ.",
    trackBody: "Toàn bộ backtest và kỳ vọng trung thực (win-rate, drawdown, chuỗi thua dài nhất) được công khai.",
    trackBtn: "Xem Track Record",
    primaryCta: "Bắt đầu miễn phí",
    home: "Trang chủ",
  },
  en: {
    badge: "Methodology",
    title: "Real strategy. Real verification.",
    intro:
      "Dralvo robots are built on clear risk-management rules and verified on real market data — no martingale, no grid, a hard stop-loss on every trade.",
    principlesTitle: "The rules every Dralvo robot follows",
    principles: [
      ["Hard stop-loss on every trade", "Each entry has a predefined stop-loss. We never hold losers or move the stop against us."],
      ["No martingale, no grid", "We never double down after a loss or average into a position. Risk per trade stays constant."],
      ["Verified on real data", "Backtested on 100%-real-tick data across years, with drawdown and the longest losing streak published."],
      ["Transparent expectations", "Win-rate, profit factor and maximum drawdown are published — the good and the bad, unvarnished."],
    ],
    strategiesTitle: "How each robot decides",
    strategies: [
      { name: "GoldMaster", tf: "D1 · Swing", accent: "gold" as Accent, d: "A daily-timeframe trend-following swing system. Long-only, using CFTC Commitment of Traders positioning as a filter; it can sit idle for long stretches when gold is weak to preserve capital." },
      { name: "GoldScalp", tf: "M15 · Momentum", accent: "steel" as Accent, d: "An M15 momentum scalper. Every trade has a hard stop-loss and a time-stop. No grid, no martingale." },
      { name: "TiGold", tf: "Free · Adaptive", accent: "green" as Accent, d: "A free adaptive XAUUSD robot via the IB partnership. Same risk-management principles, built for beginners." },
    ],
    processTitle: "How we build & verify",
    process: [
      ["01", "Design the logic", "Build entry/exit rules from trend, momentum and positioning filters — avoiding overfitting."],
      ["02", "Real-tick backtest", "Run the MT5 Strategy Tester on 100%-real-tick data across years (up to 20 for GoldMaster)."],
      ["03", "Measure risk", "Judge maximum drawdown, longest losing streak, profit factor and Sharpe — not just profit."],
      ["04", "Forward-test", "Run demo/forward to confirm live behaviour matches the backtest before release."],
      ["05", "Update transparently", "Monitor, update the EA, and publish results on the Track Record page."],
    ],
    limitsTitle: "What Dralvo does NOT do",
    limits: [
      "Promise fixed returns or “steady daily profit”.",
      "Use martingale/grid to hide blow-up risk.",
      "Sell “guaranteed-win” signals or manage your money.",
      "Treat backtest results as a guarantee of the future.",
      "Provide financial advice — information is for reference only.",
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      ["Do Dralvo robots use martingale?", "No. No Dralvo robot uses martingale or grid. Every trade has a hard stop-loss and risk per trade stays constant."],
      ["How are Dralvo EAs verified?", "They are backtested on 100%-real-tick data across years with the MT5 Strategy Tester, with maximum drawdown and the longest losing streak published, then forward-tested before release."],
      ["Do backtest results guarantee profit?", "No. Past performance does not guarantee future results. The information is for reference only and is not financial advice."],
      ["How does GoldMaster differ from GoldScalp?", "GoldMaster is a D1 trend-following swing system that uses a CFTC positioning filter. GoldScalp is an M15 momentum scalper with a hard stop-loss and a time-stop."],
      ["How much capital do I need to start?", "It depends on the robot and broker. Start on a demo account, then use small capital once you understand the risk. TiGold is free via the IB partnership."],
    ],
    trackTitle: "See the real numbers, unvarnished.",
    trackBody: "The full backtest and honest expectations (win-rate, drawdown, longest losing streak) are published openly.",
    trackBtn: "View Track Record",
    primaryCta: "Start free",
    home: "Home",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = COPY[locale];
  return {
    title: `${t.title} — ${t.badge}`,
    description: t.intro,
    alternates: { canonical: `${SITE}/methodology` },
    openGraph: {
      title: `${t.title} | Dralvo`,
      description: t.intro,
      url: `${SITE}/methodology`,
      siteName: "Dralvo",
      images: ["/brand/dralvo-og.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function MethodologyPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];
  const cc = COMMON_COPY[locale].footer;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${SITE}/methodology#article`,
        headline: t.title,
        description: t.intro,
        inLanguage: locale,
        image: `${SITE}/brand/dralvo-og.png`,
        author: { "@type": "Organization", name: "Dralvo", url: SITE },
        publisher: {
          "@type": "Organization",
          name: "Dralvo",
          logo: { "@type": "ImageObject", url: `${SITE}/brand/dralvo-icon-180.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/methodology` },
        about: "Automated XAUUSD gold trading robot (MetaTrader 5 Expert Advisor) methodology and risk management",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.home, item: SITE },
          { "@type": "ListItem", position: 2, name: t.badge, item: `${SITE}/methodology` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: t.faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  });

  return (
    <div dir={localeDir(locale)} className="min-h-dvh overflow-x-hidden bg-deep text-text-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <NavBar
        navClassName="sticky top-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border"
        containerClassName="max-w-[1180px] mx-auto px-6"
        links={mainNavLinks(locale, "/methodology")}
        actions={<MainNavActions locale={locale} />}
      />

      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-14">
          <GridPattern />
          <GlowOrb className="w-[600px] h-[600px] -right-40 -top-44 opacity-40" />
          <div className="relative z-10 mx-auto max-w-[900px] px-6">
            <span className="inline-flex items-center rounded-full border border-border bg-deep/40 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
              {t.badge}
            </span>
            <h1 className="mt-7 max-w-[800px] text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.02em] text-balance" style={{ fontFamily: SERIF }}>
              {t.title}
            </h1>
            <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-text-secondary">{t.intro}</p>
          </div>
        </section>

        {/* Core principles */}
        <section className="border-y border-border bg-surface/50 py-20">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="mb-12 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.principlesTitle}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {t.principles.map(([title, body]) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Per-robot strategy */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="mb-12 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.strategiesTitle}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {t.strategies.map((s) => (
                <article key={s.name} className="rounded-2xl border border-border bg-card p-6" style={{ borderColor: `${ACCENT[s.accent]}30` }}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl text-text-primary" style={{ fontFamily: SERIF }}>{s.name}</h3>
                    <span className="rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: ACCENT[s.accent], background: `${ACCENT[s.accent]}18`, border: `1px solid ${ACCENT[s.accent]}40` }}>{s.tf}</span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-text-secondary">{s.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Build & verify process */}
        <section className="border-y border-border bg-surface/50 py-20">
          <div className="mx-auto max-w-[1100px] px-6">
            <h2 className="mb-12 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.processTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {t.process.map(([n, title, body]) => (
                <article key={n} className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 font-mono text-xs font-bold text-gold">{n}</div>
                  <h3 className="mb-2 text-[15px] font-semibold text-text-primary">{title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What we don't do */}
        <section className="py-20">
          <div className="mx-auto max-w-[820px] px-6">
            <h2 className="mb-10 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.limitsTitle}</h2>
            <div className="space-y-3">
              {t.limits.map((item) => (
                <div key={item} className="flex gap-4 rounded-xl border border-border bg-card p-5 text-[14px] leading-relaxed text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-red">✕</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — renders FAQPage schema above (strong for GEO) */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-[820px] px-6">
            <h2 className="mb-10 text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.faqTitle}</h2>
            <div className="space-y-3">
              {t.faq.map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-border bg-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-medium text-text-primary [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="text-gold transition-transform group-open:rotate-45">＋</span>
                  </summary>
                  <p className="px-5 pb-4 text-[14px] leading-relaxed text-text-secondary">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Track-record CTA */}
        <section className="relative overflow-hidden py-24">
          <GlowOrb className="w-[500px] h-[500px] left-1/2 top-0 -translate-x-1/2 opacity-30" />
          <div className="relative z-10 mx-auto max-w-[680px] px-6 text-center">
            <h2 className="text-3xl sm:text-4xl tracking-[-0.015em]" style={{ fontFamily: SERIF }}>{t.trackTitle}</h2>
            <p className="mx-auto mt-4 mb-8 max-w-[520px] leading-relaxed text-text-secondary">{t.trackBody}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/track-record" className="inline-flex items-center justify-center rounded-lg border border-border px-7 py-3.5 text-[15px] font-semibold text-text-primary no-underline transition-all hover:border-gold/40 hover:text-gold">
                {t.trackBtn}
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-gold-bright px-7 py-3.5 text-[15px] font-semibold text-[#060609] no-underline transition-transform hover:scale-[1.03]">
                {t.primaryCta}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <BrandLink logoSize={28} wordmarkClassName="text-base" />
            <div className="flex flex-wrap items-center gap-5 text-xs text-text-secondary">
              <Link href="/track-record" className="no-underline transition-colors hover:text-gold">{cc.links.trackRecord}</Link>
              <Link href="/pricing" className="no-underline transition-colors hover:text-gold">{cc.links.pricing}</Link>
              <Link href="/blog" className="no-underline transition-colors hover:text-gold">{cc.links.blog}</Link>
              <Link href="/privacy" className="no-underline transition-colors hover:text-gold">{cc.links.privacy}</Link>
              <Link href="/terms" className="no-underline transition-colors hover:text-gold">{cc.links.terms}</Link>
              <Link href="/disclaimer" className="no-underline transition-colors hover:text-gold">{cc.links.disclaimer}</Link>
            </div>
            <div className="flex items-center gap-3">
              <InstallAppButton locale={locale} />
              <SocialLinks />
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
            <p className="text-[11px] text-text-muted">{cc.notAdvice}</p>
            <p className="text-[11px] text-text-muted">{cc.pastPerformance}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
