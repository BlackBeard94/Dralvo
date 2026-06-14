import crypto from "node:crypto";

const SEPAY_QR_URL = "https://qr.sepay.vn/img";

export type VietQrConfig = {
  enabled: boolean;
  bankBin: string | null;
  bankCode: string | null;
  accountNo: string | null;
  accountName: string | null;
  sepayWebhookApiKey: string | null;
  proPriceVnd: number;
  template: string;
};

export type VietQrPaymentRequest = {
  reference: string;
  amountVnd: number;
  addInfo: string;
  qrDataUrl: string | null;
  qrCode: string | null;
  bankBin: string;
  accountNo: string;
  accountName: string;
  template: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

export function getVietQrConfig(): VietQrConfig {
  const bankBin = requiredEnv("VIETQR_BANK_BIN");
  const bankCode = requiredEnv("VIETQR_BANK_CODE");
  const accountNo = requiredEnv("VIETQR_ACCOUNT_NO");
  const accountName = requiredEnv("VIETQR_ACCOUNT_NAME");
  const sepayWebhookApiKey = requiredEnv("SEPAY_WEBHOOK_API_KEY");

  return {
    enabled: Boolean(
      bankBin &&
        bankCode &&
        accountNo &&
        accountName &&
        sepayWebhookApiKey,
    ),
    bankBin,
    bankCode,
    accountNo,
    accountName,
    sepayWebhookApiKey,
    proPriceVnd: envNumber("VIETQR_PRO_PRICE_VND", 499000),
    template: process.env.VIETQR_TEMPLATE?.trim() || "compact",
  };
}

export function createVietQrReference(now = new Date()) {
  const datePart = now.toISOString().slice(2, 10).replaceAll("-", "");
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DRALVO${datePart}${randomPart}`.slice(0, 20);
}

export function sanitizeVietQrAddInfo(reference: string) {
  return reference.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 25);
}

export function extractVietQrReference(content: string) {
  return content.toUpperCase().match(/\bDRALVO\d{6}[A-F0-9]{6}\b/)?.[0] ?? null;
}

export function normalizeBankAccount(value: string) {
  return value.replace(/\D/g, "");
}

export function createVietQrPaymentRequest({
  reference = createVietQrReference(),
}: {
  reference?: string;
} = {}): VietQrPaymentRequest {
  const config = getVietQrConfig();

  if (
    !config.bankBin ||
    !config.bankCode ||
    !config.accountNo ||
    !config.accountName
  ) {
    throw new Error("VietQR is not configured.");
  }

  const addInfo = sanitizeVietQrAddInfo(reference);
  const qrUrl = new URL(SEPAY_QR_URL);
  qrUrl.searchParams.set("acc", config.accountNo);
  qrUrl.searchParams.set("bank", config.bankCode);
  qrUrl.searchParams.set("amount", String(config.proPriceVnd));
  qrUrl.searchParams.set("des", addInfo);
  qrUrl.searchParams.set("template", config.template);
  qrUrl.searchParams.set("showinfo", "true");
  qrUrl.searchParams.set("holder", config.accountName);
  qrUrl.searchParams.set("store", "DRALVO");

  return {
    reference,
    amountVnd: config.proPriceVnd,
    addInfo,
    qrDataUrl: qrUrl.toString(),
    qrCode: null,
    bankBin: config.bankBin,
    accountNo: config.accountNo,
    accountName: config.accountName,
    template: config.template,
  };
}

export { SEPAY_QR_URL };
