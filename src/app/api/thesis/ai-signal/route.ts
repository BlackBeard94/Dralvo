import { NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import {
  DEFAULT_AI_MODELS,
  decryptApiKey,
  type AiProvider,
} from "@/lib/ai-credentials";
import { generateAiSignal } from "@/lib/intelligence/ai-signal";
import {
  buildGoldThesis,
  type EvidenceRow,
} from "@/lib/intelligence/gold-thesis";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CredentialRow = {
  provider: AiProvider;
  encrypted_api_key: string;
  model: string | null;
};

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Evidence store is not configured" },
      { status: 503 },
    );
  }

  const { data: credential, error: credentialError } = await supabase
    .from("user_ai_credentials")
    .select("provider, encrypted_api_key, model")
    .eq("user_id", user.id)
    .maybeSingle();

  if (credentialError) {
    return NextResponse.json({ error: credentialError.message }, { status: 500 });
  }
  if (!credential) {
    return NextResponse.json(
      { error: "Connect an AI provider API key first" },
      { status: 428 },
    );
  }
  const credentialRow = credential as CredentialRow;
  let apiKey: string;
  try {
    apiKey = decryptApiKey(credentialRow.encrypted_api_key);
  } catch {
    return NextResponse.json(
      { error: "Saved AI credential cannot be decrypted" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("evidence_observations")
    .select(
      "driver_key,series_key,numeric_value,unit,observed_at,source_url,quality",
    )
    .in(
      "driver_key",
      IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => driver.driverKey),
    )
    .order("observed_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const thesis = buildGoldThesis((data ?? []) as EvidenceRow[]);
  let locale: SupportedLocale = "vi";
  try {
    const body = (await request.json()) as { locale?: string };
    if (isSupportedLocale(body.locale)) locale = body.locale;
  } catch {
    locale = "vi";
  }

  try {
    const signal = await generateAiSignal({
      thesis,
      apiKey,
      provider: credentialRow.provider,
      model:
        credentialRow.model?.trim() ||
        DEFAULT_AI_MODELS[credentialRow.provider],
      locale,
    });

    return NextResponse.json({
      ok: true,
      signal,
      generatedAt: new Date().toISOString(),
      provider: credentialRow.provider,
      model:
        credentialRow.model?.trim() ||
        DEFAULT_AI_MODELS[credentialRow.provider],
    });
  } catch (signalError) {
    const message =
      signalError instanceof Error
        ? signalError.message
        : "AI signal generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
