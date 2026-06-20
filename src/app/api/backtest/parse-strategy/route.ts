import { NextResponse } from "next/server";

import {
  parseStrategyPrompt,
  type StrategyDirection,
  type StrategySpec,
  type StrategyTemplate,
} from "@/lib/backtest/strategy-lab";

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AiStrategyPayload = Partial<StrategySpec> & {
  supported?: boolean;
  summary?: string;
  assumptions?: string[];
  unsupportedReason?: string;
  missingFeatures?: string[];
  closestTemplate?: StrategyTemplate;
};

type ParseSource = "deepseek" | "local-fallback";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const STRATEGY_TEMPLATES: StrategyTemplate[] = ["ema-cross", "rsi-reversion", "breakout"];
const STRATEGY_DIRECTIONS: StrategyDirection[] = ["long", "short", "both"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

function asTemplate(value: unknown): StrategyTemplate {
  return STRATEGY_TEMPLATES.includes(value as StrategyTemplate)
    ? (value as StrategyTemplate)
    : "ema-cross";
}

function asDirection(value: unknown): StrategyDirection {
  return STRATEGY_DIRECTIONS.includes(value as StrategyDirection)
    ? (value as StrategyDirection)
    : "both";
}

function sanitizeSpec(payload: AiStrategyPayload): StrategySpec {
  const fastEma = Math.round(asNumber(payload.fastEma, 20, 2, 100));
  const slowEma = Math.round(asNumber(payload.slowEma, 50, fastEma + 1, 300));

  return {
    template: asTemplate(payload.template),
    direction: asDirection(payload.direction),
    fastEma,
    slowEma,
    rsiPeriod: Math.round(asNumber(payload.rsiPeriod, 14, 2, 50)),
    rsiBuyBelow: asNumber(payload.rsiBuyBelow, 35, 10, 50),
    rsiSellAbove: asNumber(payload.rsiSellAbove, 65, 50, 90),
    breakoutLookback: Math.round(asNumber(payload.breakoutLookback, 24, 5, 200)),
    atrPeriod: Math.round(asNumber(payload.atrPeriod, 14, 2, 80)),
    stopAtr: asNumber(payload.stopAtr, 1.5, 0.3, 8),
    targetAtr: asNumber(payload.targetAtr, 3, 0.5, 16),
    riskPct: asNumber(payload.riskPct, 1, 0.1, 5),
  };
}

function extractJson(content: string) {
  try {
    return JSON.parse(content) as AiStrategyPayload;
  } catch {
    const cleaned = content
      .replace(/```json/gi, "```")
      .replace(/```/g, "")
      .trim();
    try {
      return JSON.parse(cleaned) as AiStrategyPayload;
    } catch {
      // Continue to object extraction below.
    }

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response did not include JSON");
    return JSON.parse(match[0]) as AiStrategyPayload;
  }
}

function fallbackResponse(prompt: string, reason: string, status = 200) {
  return NextResponse.json(
    {
      spec: parseStrategyPrompt(prompt),
      source: "local-fallback" satisfies ParseSource,
      summary: "AI parser was unavailable, so Dralvo used the local strategy parser.",
      assumptions: [reason],
      warning: reason,
      supported: true,
    },
    { status },
  );
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 6)
    : [];
}

export async function POST(request: Request) {
  let body: { prompt?: unknown; symbol?: unknown; timeframe?: unknown };
  try {
    body = (await request.json()) as { prompt?: unknown; symbol?: unknown; timeframe?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 8) {
    return NextResponse.json({ error: "Strategy prompt is too short" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return fallbackResponse(prompt, "DeepSeek API key is not configured");
  }

  const symbol = typeof body.symbol === "string" ? body.symbol : "unknown";
  const timeframe = typeof body.timeframe === "string" ? body.timeframe : "unknown";

  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are a deterministic trading-strategy compatibility checker and parser. You MUST return one valid JSON object and nothing else. Do not use markdown. The current backtest engine can execute ONLY these exact templates: ema-cross, rsi-reversion, breakout. Supported direction: long, short, both. Risk model supports fixed riskPct, ATR stop, ATR target only. If the prompt requires unsupported logic such as SMC, order blocks, liquidity sweeps, supply/demand zones, Fibonacci, MACD, Bollinger Bands, grid, martingale, DCA, hedging, trailing stop, partial close, multi-timeframe confirmation, sessions, news filters, custom indicators, price action patterns, or any condition not representable by the 3 templates, return supported=false. Do NOT silently map unsupported strategies to a template. Only return supported=true when the executable logic can be represented by one of the 3 templates without changing its meaning.",
        },
        {
          role: "user",
          content: [
            `Symbol: ${symbol}`,
            `Timeframe: ${timeframe}`,
            `Strategy prompt: ${prompt}`,
            "Return exactly this JSON shape:",
            '{"supported":true,"template":"ema-cross","direction":"both","fastEma":20,"slowEma":50,"rsiPeriod":14,"rsiBuyBelow":35,"rsiSellAbove":65,"breakoutLookback":24,"atrPeriod":14,"stopAtr":1.5,"targetAtr":3,"riskPct":1,"summary":"short explanation","assumptions":["short assumption"],"unsupportedReason":null,"missingFeatures":[],"closestTemplate":null}',
            "For unsupported strategies return supported=false with closestTemplate as the nearest template only for reference, plus unsupportedReason and missingFeatures. Still include numeric defaults so the JSON shape is complete.",
          ].join("\n"),
        },
      ],
    }),
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : "DeepSeek request failed";
    return null as Response | null;
  });

  if (!response) {
    return fallbackResponse(prompt, "DeepSeek request failed");
  }

  const data = (await response.json()) as DeepSeekChatResponse;
  if (!response.ok) {
    return fallbackResponse(prompt, data.error?.message ?? `DeepSeek returned ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return fallbackResponse(prompt, "DeepSeek returned an empty response");
  }

  try {
    const payload = extractJson(content);
    const spec = sanitizeSpec(payload);
    const supported = payload.supported !== false;
    return NextResponse.json({
      spec,
      source: "deepseek" satisfies ParseSource,
      supported,
      summary: typeof payload.summary === "string" ? payload.summary : null,
      assumptions: stringArray(payload.assumptions),
      unsupportedReason: supported
        ? null
        : typeof payload.unsupportedReason === "string"
          ? payload.unsupportedReason
          : "This strategy cannot be represented by the current backtest templates.",
      missingFeatures: supported ? [] : stringArray(payload.missingFeatures),
      closestTemplate: supported ? null : asTemplate(payload.closestTemplate ?? payload.template),
    });
  } catch (error) {
    return fallbackResponse(
      prompt,
      error instanceof Error ? error.message : "Invalid AI strategy JSON",
    );
  }
}
