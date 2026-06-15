import type { GoldThesis, TradeSimulationAction } from "./gold-thesis";
import type { AiProvider } from "@/lib/ai-credentials";

export type AiSignal = {
  action: TradeSimulationAction;
  confidence: "high" | "medium" | "low";
  headline: string;
  summary: string;
  setup: string;
  riskNote: string;
  bullets: string[];
};

type ResponsesApiOutput = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type ChatCompletionOutput = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type GeminiOutput = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const AI_SIGNAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    action: {
      type: "string",
      enum: ["simulated_buy", "simulated_sell", "stand_aside"],
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
    headline: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    setup: {
      type: "string",
    },
    riskNote: {
      type: "string",
    },
    bullets: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "action",
    "confidence",
    "headline",
    "summary",
    "setup",
    "riskNote",
    "bullets",
  ],
} as const;

function extractOutputText(response: ResponsesApiOutput) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function parseSignal(text: string): AiSignal {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(normalized) as Partial<AiSignal>;
  if (
    parsed.action !== "simulated_buy" &&
    parsed.action !== "simulated_sell" &&
    parsed.action !== "stand_aside"
  ) {
    throw new Error("Invalid AI signal action");
  }
  if (
    parsed.confidence !== "high" &&
    parsed.confidence !== "medium" &&
    parsed.confidence !== "low"
  ) {
    throw new Error("Invalid AI signal confidence");
  }
  if (
    typeof parsed.headline !== "string" ||
    typeof parsed.summary !== "string" ||
    typeof parsed.setup !== "string" ||
    typeof parsed.riskNote !== "string" ||
    !Array.isArray(parsed.bullets) ||
    parsed.bullets.some((item) => typeof item !== "string")
  ) {
    throw new Error("Invalid AI signal payload");
  }
  return {
    action: parsed.action,
    confidence: parsed.confidence,
    headline: parsed.headline,
    summary: parsed.summary,
    setup: parsed.setup,
    riskNote: parsed.riskNote,
    bullets: parsed.bullets.slice(0, 4),
  };
}

function compactThesis(thesis: GoldThesis) {
  return {
    state: thesis.state,
    summary: thesis.summary,
    coverage: thesis.coverage,
    priceRelationship: thesis.priceRelationship,
    tradeSimulation: thesis.tradeSimulation,
    drivers: thesis.drivers.map((driver) => ({
      driverKey: driver.driverKey,
      label: driver.label,
      state: driver.state,
      score: driver.score,
      evidence: driver.evidence,
      observedAt: driver.observedAt,
    })),
  };
}

function signalInstruction(locale: "vi" | "en" | "pt-BR") {
  const language =
    locale === "vi"
      ? "Vietnamese"
      : locale === "pt-BR"
        ? "Brazilian Portuguese"
        : "English";
  return [
    "You are Dralvo's market brief writer.",
    `Write in ${language}.`,
    "Summarize verified XAUUSD evidence into a concise educational scenario.",
    "You are not a financial adviser. Never claim certainty. Never instruct the user to trade.",
    "Do not invent prices, SL, TP, or sources. Use the provided tradeSimulation levels only.",
    "If evidence is insufficient, stale, mixed, or divergent, prefer stand_aside.",
    "Return only JSON with keys: action, confidence, headline, summary, setup, riskNote, bullets.",
    "action must be one of simulated_buy, simulated_sell, stand_aside.",
    "confidence must be one of high, medium, low.",
    "bullets must contain 3 or 4 short strings.",
  ].join(" ");
}

function signalPayload(thesis: GoldThesis, locale: "vi" | "en" | "pt-BR") {
  return JSON.stringify({
    locale,
    thesis: compactThesis(thesis),
  });
}

async function generateOpenAiSignal({
  thesis,
  apiKey,
  model,
  locale = "vi",
}: {
  thesis: GoldThesis;
  apiKey: string;
  model: string;
  locale?: "vi" | "en" | "pt-BR";
}): Promise<AiSignal> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "dralvo_ai_signal",
          strict: true,
          schema: AI_SIGNAL_SCHEMA,
        },
      },
      input: [
        {
          role: "system",
          content: signalInstruction(locale),
        },
        {
          role: "user",
          content: signalPayload(thesis, locale),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as ResponsesApiOutput;
  const text = extractOutputText(data);
  if (!text) throw new Error("OpenAI response did not include output text");
  return parseSignal(text);
}

async function generateDeepSeekSignal({
  thesis,
  apiKey,
  model,
  locale,
}: {
  thesis: GoldThesis;
  apiKey: string;
  model: string;
  locale: "vi" | "en" | "pt-BR";
}) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: signalInstruction(locale) },
        { role: "user", content: signalPayload(thesis, locale) },
      ],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${body}`);
  }
  const data = (await response.json()) as ChatCompletionOutput;
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("DeepSeek response did not include content");
  return parseSignal(text);
}

async function generateGeminiSignal({
  thesis,
  apiKey,
  model,
  locale,
}: {
  thesis: GoldThesis;
  apiKey: string;
  model: string;
  locale: "vi" | "en" | "pt-BR";
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${signalInstruction(locale)}\n\n${signalPayload(thesis, locale)}`,
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${body}`);
  }
  const data = (await response.json()) as GeminiOutput;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini response did not include content");
  return parseSignal(text);
}

export async function generateAiSignal({
  thesis,
  apiKey,
  provider,
  model,
  locale = "vi",
}: {
  thesis: GoldThesis;
  apiKey: string;
  provider: AiProvider;
  model: string;
  locale?: "vi" | "en" | "pt-BR";
}): Promise<AiSignal> {
  if (provider === "openai") {
    return generateOpenAiSignal({ thesis, apiKey, model, locale });
  }
  if (provider === "deepseek") {
    return generateDeepSeekSignal({ thesis, apiKey, model, locale });
  }
  return generateGeminiSignal({ thesis, apiKey, model, locale });
}
