import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export type AiProvider = "openai" | "gemini" | "deepseek";

export const AI_PROVIDERS: AiProvider[] = ["openai", "gemini", "deepseek"];

export const DEFAULT_AI_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  deepseek: "deepseek-chat",
};

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && AI_PROVIDERS.includes(value as AiProvider);
}

function encryptionKey() {
  const secret = process.env.AI_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AI_CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptApiKey(payload: string) {
  const [version, iv, tag, encrypted] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) {
    throw new Error("Unsupported encrypted credential format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskApiKey(apiKey: string) {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
