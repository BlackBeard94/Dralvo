"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, KeyRound, Loader2, Trash2 } from "lucide-react";

import type { AiProvider } from "@/lib/ai-credentials";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

const providerOptions: Array<{
  value: AiProvider;
  label: string;
  description: string;
  defaultModel: string;
}> = [
  {
    value: "openai",
    label: "ChatGPT / OpenAI",
    description: "Dùng OpenAI API key cho nút tạo AI signal.",
    defaultModel: "gpt-4o-mini",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    description: "Dùng Gemini API key từ Google AI Studio.",
    defaultModel: "gemini-2.0-flash",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    description: "Dùng DeepSeek API key tương thích chat completions.",
    defaultModel: "deepseek-chat",
  },
];

type CredentialState =
  | { configured: false }
  | {
      configured: true;
      provider: AiProvider;
      model: string;
      maskedKey: string;
      updatedAt?: string;
    };

const copy = {
  vi: {
    title: "Kết nối AI signal",
    description:
      "Lưu API key riêng của bạn để Dralvo tạo bản tóm tắt và signal mô phỏng từ dữ liệu đã xác minh.",
    provider: "Nhà cung cấp",
    apiKey: "API key",
    model: "Model",
    save: "Lưu kết nối",
    saving: "Đang lưu...",
    disconnect: "Gỡ kết nối",
    connected: "Đã kết nối",
    notConnected: "Chưa kết nối AI provider.",
    keyPlaceholder: "Dán API key mới để lưu hoặc thay thế",
    modelHint: "Có thể đổi model nếu tài khoản của bạn hỗ trợ.",
    security:
      "API key được mã hóa phía server. Trình duyệt chỉ thấy trạng thái đã kết nối, không nhận lại key gốc.",
    saved: "Đã lưu AI provider.",
    removed: "Đã gỡ kết nối AI provider.",
  },
  en: {
    title: "AI signal connection",
    description:
      "Store your own API key so Dralvo can generate a concise brief and simulated signal from verified evidence.",
    provider: "Provider",
    apiKey: "API key",
    model: "Model",
    save: "Save connection",
    saving: "Saving...",
    disconnect: "Disconnect",
    connected: "Connected",
    notConnected: "No AI provider connected.",
    keyPlaceholder: "Paste a new API key to save or replace",
    modelHint: "You can change the model if your account supports it.",
    security:
      "API keys are encrypted server-side. The browser only sees connection status, never the raw key again.",
    saved: "AI provider saved.",
    removed: "AI provider disconnected.",
  },
  "pt-BR": {
    title: "Conexao de sinal IA",
    description:
      "Salve sua propria API key para o Dralvo gerar um resumo e sinal simulado com evidencias verificadas.",
    provider: "Provedor",
    apiKey: "API key",
    model: "Modelo",
    save: "Salvar conexao",
    saving: "Salvando...",
    disconnect: "Desconectar",
    connected: "Conectado",
    notConnected: "Nenhum provedor IA conectado.",
    keyPlaceholder: "Cole uma nova API key para salvar ou substituir",
    modelHint: "Voce pode trocar o modelo se sua conta suportar.",
    security:
      "As API keys sao criptografadas no servidor. O navegador ve apenas o status, nunca a chave original.",
    saved: "Provedor IA salvo.",
    removed: "Provedor IA desconectado.",
  },
} as const;

export function AiProviderSettings() {
  const { locale } = useLocale();
  const t = copy[locale as keyof typeof copy] ?? copy.en;
  const [credential, setCredential] = useState<CredentialState | null>(null);
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(providerOptions[0].defaultModel);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProvider = useMemo(
    () => providerOptions.find((option) => option.value === provider),
    [provider],
  );

  useEffect(() => {
    let active = true;
    async function loadCredential() {
      setLoading(true);
      try {
        const response = await fetch("/api/user/ai-credentials", {
          cache: "no-store",
        });
        const data = (await response.json()) as CredentialState & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? `HTTP ${response.status}`);
        }
        if (!active) return;
        setCredential(data);
        if (data.configured) {
          setProvider(data.provider);
          setModel(data.model);
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "AI provider unavailable",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCredential();
    return () => {
      active = false;
    };
  }, []);

  function updateProvider(nextProvider: AiProvider) {
    setProvider(nextProvider);
    const option = providerOptions.find((item) => item.value === nextProvider);
    setModel(option?.defaultModel ?? "");
  }

  async function saveCredential() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/user/ai-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, model }),
      });
      const data = (await response.json()) as CredentialState & {
        error?: string;
      };
      if (!response.ok || !data.configured) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setCredential(data);
      setApiKey("");
      setMessage(t.saved);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save API key",
      );
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/user/ai-credentials", {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setCredential({ configured: false });
      setApiKey("");
      setMessage(t.removed);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not disconnect AI provider",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Bot className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg text-text-primary">
              {t.title}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-text-muted">
            {t.description}
          </p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px]",
            credential?.configured
              ? "border-green/30 bg-green/10 text-green"
              : "border-border bg-card text-text-muted",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {credential?.configured ? t.connected : t.notConnected}
        </div>
      </div>

      {credential?.configured && (
        <div className="mt-4 rounded-xl border border-border bg-card p-3 text-sm text-text-secondary">
          <span className="text-text-muted">{t.connected}: </span>
          <strong className="text-text-primary">
            {
              providerOptions.find(
                (option) => option.value === credential.provider,
              )?.label
            }
          </strong>{" "}
          · {credential.model} · {credential.maskedKey}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-2">
          <label className="text-[12px] uppercase tracking-wider text-text-muted">
            {t.provider}
          </label>
          <div className="grid gap-2">
            {providerOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateProvider(option.value)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  provider === option.value
                    ? "border-gold/50 bg-gold/10"
                    : "border-border bg-card hover:border-border-strong",
                )}
              >
                <span className="block text-sm font-semibold text-text-primary">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-text-muted">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-4">
          <label className="grid gap-2">
            <span className="text-[12px] uppercase tracking-wider text-text-muted">
              {t.apiKey}
            </span>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-deep px-3 py-2">
              <KeyRound className="h-4 w-4 text-text-muted" />
              <input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                type="password"
                autoComplete="off"
                placeholder={t.keyPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] uppercase tracking-wider text-text-muted">
              {t.model}
            </span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={selectedProvider?.defaultModel}
              className="rounded-lg border border-border bg-deep px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            <span className="text-xs leading-5 text-text-muted">
              {t.modelHint}
            </span>
          </label>

          <p className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs leading-5 text-gold">
            {t.security}
          </p>

          {error && <p className="font-mono text-xs text-red">{error}</p>}
          {message && <p className="text-xs text-green">{message}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveCredential()}
              disabled={saving || loading || apiKey.trim().length < 12}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-action px-4 py-2 text-xs font-semibold text-[#060609] transition hover:bg-gold-actionHover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? t.saving : t.save}
            </button>
            {credential?.configured && (
              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-text-secondary transition hover:border-red/40 hover:text-red disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t.disconnect}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
