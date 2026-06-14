import type {
  GoldThesis,
  PriceRelationshipInsight,
  ThesisDriverState,
  ThesisState,
} from "@/lib/intelligence/gold-thesis";
import type { SupportedLocale } from "@/lib/i18n";

type LocalDriverCopy = {
  label: string;
  rule: string;
};

const TITLE_COPY: Record<SupportedLocale, Record<ThesisState, string>> = {
  vi: {
    supportive: "Bằng chứng vàng đang nghiêng về hỗ trợ",
    adverse: "Bằng chứng vàng đang nghiêng về bất lợi",
    mixed: "Bằng chứng vàng đang trái chiều",
    insufficient_data: "Chưa đủ bằng chứng đã xác minh",
  },
  en: {
    supportive: "Gold evidence is broadly supportive",
    adverse: "Gold evidence is broadly adverse",
    mixed: "Gold evidence is mixed",
    insufficient_data: "Not enough verified evidence",
  },
  "pt-BR": {
    supportive: "As evidências do ouro são amplamente favoráveis",
    adverse: "As evidências do ouro são amplamente adversas",
    mixed: "As evidências do ouro estão mistas",
    insufficient_data: "Ainda não há evidência verificada suficiente",
  },
};

const DRIVER_COPY: Record<SupportedLocale, Record<string, LocalDriverCopy>> = {
  vi: {
    "xauusd-price-context": {
      label: "Ngữ cảnh giá XAUUSD",
      rule:
        "Thay đổi ngày >= +0,30% là ngữ cảnh hỗ trợ; <= -0,30% là ngữ cảnh bất lợi.",
    },
    "tips-real-yield": {
      label: "Lợi suất thực TIPS 10Y",
      rule:
        "Lợi suất thực giảm ít nhất 2 bps hỗ trợ vàng; tăng ít nhất 2 bps là bất lợi.",
    },
    "cftc-gold-positioning": {
      label: "Vị thế vàng CFTC",
      rule:
        "Thay đổi tuần vượt 3% vị thế ròng trước đó hoặc 5.000 hợp đồng được xem là đáng kể.",
    },
    "comex-gold-inventory": {
      label: "Tồn kho vàng COMEX",
      rule:
        "Biến động tồn kho registered trên 0,5% hoặc 50.000 oz được xem là đáng kể; rút kho hỗ trợ bối cảnh khan hiếm.",
    },
    "gld-gold-holdings": {
      label: "Lượng vàng nắm giữ GLD",
      rule: "Thay đổi lượng vàng nắm giữ từ 0,5 tấn trở lên được xem là đáng kể.",
    },
  },
  en: {
    "xauusd-price-context": {
      label: "XAUUSD Price Context",
      rule:
        "Daily change >= +0.30% is supportive context; <= -0.30% is adverse context.",
    },
    "tips-real-yield": {
      label: "10Y TIPS Real Yield",
      rule:
        "A fall of at least 2 bps supports gold; a rise of at least 2 bps is adverse.",
    },
    "cftc-gold-positioning": {
      label: "CFTC Gold Positioning",
      rule:
        "A weekly change exceeding 3% of the prior net position or 5,000 contracts is material.",
    },
    "comex-gold-inventory": {
      label: "COMEX Gold Inventory",
      rule:
        "A registered-stock move above 0.5% or 50,000 oz is treated as material; draws support scarcity context.",
    },
    "gld-gold-holdings": {
      label: "GLD Gold Holdings",
      rule: "A holdings change of at least 0.5 tonnes is treated as material.",
    },
  },
  "pt-BR": {
    "xauusd-price-context": {
      label: "Contexto de preço XAUUSD",
      rule:
        "Variação diária >= +0,30% é contexto favorável; <= -0,30% é contexto adverso.",
    },
    "tips-real-yield": {
      label: "Juro real TIPS 10Y",
      rule:
        "Queda de pelo menos 2 bps favorece ouro; alta de pelo menos 2 bps é adversa.",
    },
    "cftc-gold-positioning": {
      label: "Posicionamento CFTC em ouro",
      rule:
        "Mudança semanal acima de 3% da posição líquida anterior ou 5.000 contratos é material.",
    },
    "comex-gold-inventory": {
      label: "Estoque de ouro COMEX",
      rule:
        "Movimento de estoque registered acima de 0,5% ou 50.000 oz é material; retiradas favorecem o contexto de escassez.",
    },
    "gld-gold-holdings": {
      label: "Reservas de ouro GLD",
      rule: "Mudança de pelo menos 0,5 tonelada nas reservas é material.",
    },
  },
};

const CHANGE_CONDITIONS: Record<SupportedLocale, string[]> = {
  vi: [
    "Đảo chiều đáng kể trong hướng lợi suất thực 10Y.",
    "Thay đổi tuần đáng kể trong vị thế ròng Managed Money.",
    "Tăng hoặc giảm đáng kể tồn kho COMEX registered.",
    "GLD thay đổi lượng nắm giữ ít nhất 0,5 tấn.",
    "Ngữ cảnh giá lệch khỏi cán cân driver cơ bản.",
  ],
  en: [
    "A material reversal in 10Y real-yield direction.",
    "A material weekly change in Managed Money net positioning.",
    "A material COMEX registered-stock build or draw.",
    "A GLD holdings change of at least 0.5 tonnes.",
    "Price context diverging from the fundamental driver balance.",
  ],
  "pt-BR": [
    "Reversão material na direção do juro real de 10 anos.",
    "Mudança semanal material no posicionamento líquido de Managed Money.",
    "Aumento ou retirada material no estoque registered da COMEX.",
    "Mudança de pelo menos 0,5 tonelada nas reservas do GLD.",
    "Contexto de preço divergindo do balanço dos drivers fundamentais.",
  ],
};

const RELATIONSHIP_COPY: Record<
  SupportedLocale,
  Record<
    PriceRelationshipInsight["state"],
    { title: string; summary: string }
  >
> = {
  vi: {
    confirming: {
      title: "Giá xác nhận cán cân cơ bản",
      summary:
        "Hướng giá XAUUSD trong ngày và cán cân driver cơ bản đang cùng chiều. Đây là ngữ cảnh, không phải dự báo.",
    },
    diverging: {
      title: "Giá đang phân kỳ với cán cân cơ bản",
      summary:
        "Hướng giá XAUUSD trong ngày đang đi ngược cán cân driver cơ bản. Dralvo chỉ đánh dấu bất đồng, không giả định nó sẽ được giải quyết theo hướng nào.",
    },
    neutral: {
      title: "Chưa có quan hệ giá đủ rõ",
      summary:
        "Giá hoặc cán cân bằng chứng cơ bản chưa đủ định hướng để phân loại là xác nhận hay phân kỳ.",
    },
    insufficient_data: {
      title: "Chưa thể so sánh quan hệ giá",
      summary:
        "Dralvo cần ngữ cảnh giá khả dụng và ít nhất ba nhóm driver cơ bản trước khi so sánh hướng.",
    },
  },
  en: {
    confirming: {
      title: "Price confirms the fundamental balance",
      summary:
        "XAUUSD daily direction and the current balance of fundamental drivers point the same way. This is context, not a forecast.",
    },
    diverging: {
      title: "Price diverges from the fundamental balance",
      summary:
        "XAUUSD daily direction is moving against the current balance of fundamental drivers. Dralvo flags the disagreement without assuming how it will resolve.",
    },
    neutral: {
      title: "No directional price relationship",
      summary:
        "Price or the fundamental evidence balance is not directional enough to classify confirmation or divergence.",
    },
    insufficient_data: {
      title: "Price relationship is unavailable",
      summary:
        "Dralvo needs usable price context and at least three fundamental driver groups before comparing their direction.",
    },
  },
  "pt-BR": {
    confirming: {
      title: "O preço confirma o balanço fundamental",
      summary:
        "A direção diária do XAUUSD e o balanço atual dos drivers fundamentais apontam para o mesmo lado. É contexto, não previsão.",
    },
    diverging: {
      title: "O preço diverge do balanço fundamental",
      summary:
        "A direção diária do XAUUSD está contra o balanço atual dos drivers fundamentais. A Dralvo sinaliza a discordância sem presumir como ela será resolvida.",
    },
    neutral: {
      title: "Sem relação direcional clara",
      summary:
        "O preço ou o balanço das evidências fundamentais não tem direção suficiente para classificar confirmação ou divergência.",
    },
    insufficient_data: {
      title: "Relação de preço indisponível",
      summary:
        "A Dralvo precisa de contexto de preço utilizável e pelo menos três grupos fundamentais antes de comparar as direções.",
    },
  },
};

function summary(thesis: GoldThesis, locale: SupportedLocale) {
  const fundamentals = thesis.drivers.filter(
    (driver) =>
      driver.driverKey !== "xauusd-price-context" &&
      driver.state !== "missing" &&
      driver.state !== "stale",
  ).length;
  const supportive = thesis.supportingDrivers.length;
  const adverse = thesis.contradictingDrivers.length;
  const neutral = thesis.neutralDrivers.length;

  if (locale === "en") {
    return thesis.state === "insufficient_data"
      ? `Only ${fundamentals} of 4 fundamental driver groups are currently usable alongside price context.`
      : `${supportive} drivers are supportive, ${adverse} are adverse, and ${neutral} are neutral.`;
  }

  if (locale === "pt-BR") {
    return thesis.state === "insufficient_data"
      ? `Apenas ${fundamentals} de 4 grupos fundamentais estão utilizáveis junto ao contexto de preço.`
      : `${supportive} drivers são favoráveis, ${adverse} são adversos e ${neutral} são neutros.`;
  }

  return thesis.state === "insufficient_data"
    ? `Chỉ ${fundamentals} trong 4 nhóm driver cơ bản đang dùng được cùng với ngữ cảnh giá.`
    : `${supportive} driver đang hỗ trợ, ${adverse} driver bất lợi và ${neutral} driver trung lập.`;
}

function staleSuffix(locale: SupportedLocale) {
  switch (locale) {
    case "en":
      return " The observation is beyond the configured freshness window.";
    case "pt-BR":
      return " Esta observação está fora da janela de atualização configurada.";
    default:
      return " Quan sát này đã quá hạn so với khung cập nhật đã cấu hình.";
  }
}

function localizeEvidence(driver: ThesisDriverState, locale: SupportedLocale) {
  const stale = driver.evidence.includes(
    "The observation is beyond the configured freshness window.",
  );
  const evidence = driver.evidence.replace(
    " The observation is beyond the configured freshness window.",
    "",
  );
  const staleText = stale ? staleSuffix(locale) : "";

  if (locale === "en") return evidence + staleText;

  if (driver.state === "missing") {
    return (
      (locale === "pt-BR"
        ? "A observação obrigatória da fonte não está disponível."
        : "Quan sát nguồn bắt buộc chưa khả dụng.") + staleText
    );
  }

  const xauusd = evidence.match(
    /^XAUUSD closed at \$(.+) with a ([+-].+)% daily change\.$/,
  );
  if (xauusd) {
    return (
      (locale === "pt-BR"
        ? `XAUUSD fechou em $${xauusd[1]} com variação diária de ${xauusd[2]}%.`
        : `XAUUSD đóng cửa ở $${xauusd[1]} với thay đổi ngày ${xauusd[2]}%.`) +
      staleText
    );
  }

  const tips = evidence.match(
    /^The 10Y real yield is (.+)%, changing ([+-].+) bps\.$/,
  );
  if (tips) {
    return (
      (locale === "pt-BR"
        ? `O juro real de 10 anos está em ${tips[1]}%, mudando ${tips[2]} bps.`
        : `Lợi suất thực 10Y là ${tips[1]}%, thay đổi ${tips[2]} bps.`) +
      staleText
    );
  }

  const cftc = evidence.match(
    /^Managed Money net positioning changed ([+-].+) contracts from the prior report\.$/,
  );
  if (cftc) {
    return (
      (locale === "pt-BR"
        ? `Posicionamento líquido de Managed Money mudou ${cftc[1]} contratos frente ao relatório anterior.`
        : `Vị thế ròng Managed Money thay đổi ${cftc[1]} hợp đồng so với báo cáo trước.`) +
      staleText
    );
  }

  const comex = evidence.match(
    /^Registered stocks are (.+) oz with a ([+-].+) oz reported change\.$/,
  );
  if (comex) {
    return (
      (locale === "pt-BR"
        ? `Estoque registered é ${comex[1]} oz, com mudança reportada de ${comex[2]} oz.`
        : `Tồn kho registered là ${comex[1]} oz, với thay đổi báo cáo ${comex[2]} oz.`) +
      staleText
    );
  }

  const gld = evidence.match(
    /^GLD holds (.+) tonnes, changing ([+-].+) tonnes from the prior issuer observation\.$/,
  );
  if (gld) {
    return (
      (locale === "pt-BR"
        ? `GLD nắm giữ ${gld[1]} tấn, thay đổi ${gld[2]} tấn so với quan sát trước của issuer.`
        : `GLD nắm giữ ${gld[1]} tấn, thay đổi ${gld[2]} tấn so với quan sát trước của issuer.`) +
      staleText
    );
  }

  return driver.evidence;
}

function localizeDriver(
  driver: ThesisDriverState,
  locale: SupportedLocale,
): ThesisDriverState {
  const copy = DRIVER_COPY[locale][driver.driverKey];
  if (!copy) return driver;
  return {
    ...driver,
    label: copy.label,
    evidence: localizeEvidence(driver, locale),
    rule: copy.rule,
  };
}

export function localizeDriverLabel(driverKey: string, locale: SupportedLocale) {
  return DRIVER_COPY[locale][driverKey]?.label ?? driverKey;
}

export function localizeThesis(
  thesis: GoldThesis,
  locale: SupportedLocale,
): GoldThesis {
  const drivers = thesis.drivers.map((driver) => localizeDriver(driver, locale));
  const byKey = new Map(drivers.map((driver) => [driver.driverKey, driver]));
  const pick = (source: ThesisDriverState[]) =>
    source.map((driver) => byKey.get(driver.driverKey) ?? localizeDriver(driver, locale));
  const priceRelationship = thesis.priceRelationship
    ? {
        ...thesis.priceRelationship,
        ...RELATIONSHIP_COPY[locale][thesis.priceRelationship.state],
      }
    : undefined;

  return {
    ...thesis,
    title: TITLE_COPY[locale][thesis.state],
    summary: summary(thesis, locale),
    drivers,
    supportingDrivers: pick(thesis.supportingDrivers),
    contradictingDrivers: pick(thesis.contradictingDrivers),
    neutralDrivers: pick(thesis.neutralDrivers),
    staleDrivers: pick(thesis.staleDrivers),
    missingDrivers: pick(thesis.missingDrivers),
    priceRelationship,
    changeConditions: CHANGE_CONDITIONS[locale],
  };
}
