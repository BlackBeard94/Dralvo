import { NextResponse } from "next/server";

import {
  DEFAULT_AI_MODELS,
  decryptApiKey,
  encryptApiKey,
  isAiProvider,
  maskApiKey,
  type AiProvider,
} from "@/lib/ai-credentials";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type CredentialRow = {
  provider: AiProvider;
  encrypted_api_key: string;
  model: string | null;
  updated_at: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("user_ai_credentials")
    .select("provider, encrypted_api_key, model, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ configured: false });
  }

  try {
    const row = data as CredentialRow;
    const apiKey = decryptApiKey(row.encrypted_api_key);
    return NextResponse.json({
      configured: true,
      provider: row.provider,
      model: row.model ?? DEFAULT_AI_MODELS[row.provider],
      maskedKey: maskApiKey(apiKey),
      updatedAt: row.updated_at,
    });
  } catch {
    return NextResponse.json({
      configured: true,
      provider: (data as CredentialRow).provider,
      model:
        (data as CredentialRow).model ??
        DEFAULT_AI_MODELS[(data as CredentialRow).provider],
      maskedKey: "configured",
      updatedAt: (data as CredentialRow).updated_at,
    });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  let body: { provider?: unknown; apiKey?: unknown; model?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isAiProvider(body.provider)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }
  if (typeof body.apiKey !== "string" || body.apiKey.trim().length < 12) {
    return NextResponse.json({ error: "API key is too short" }, { status: 400 });
  }
  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : DEFAULT_AI_MODELS[body.provider];

  let encrypted: string;
  try {
    encrypted = encryptApiKey(body.apiKey.trim());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Encryption failed" },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("user_ai_credentials").upsert({
    user_id: user.id,
    provider: body.provider,
    encrypted_api_key: encrypted,
    model,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    provider: body.provider,
    model,
    maskedKey: maskApiKey(body.apiKey.trim()),
  });
}

export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("user_ai_credentials")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, configured: false });
}
