import crypto from "node:crypto";

import {
  extractVietQrReference,
  getVietQrConfig,
  normalizeBankAccount,
} from "@/lib/vietqr";

export type SepayWebhookPayload = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string | null;
  code?: string | null;
  content: string;
  transferType: "in" | "out";
  description?: string | null;
  transferAmount: number;
  accumulated?: number | null;
  referenceCode?: string | null;
};

export type ValidSepayPayment = {
  payload: SepayWebhookPayload;
  reference: string;
  transactionAt: string;
};

export type SepayApiTransaction = {
  id: number;
  transaction_date: string;
  account_number: string;
  transfer_type?: string | null;
  amount_in?: number | string | null;
  amount_out?: number | string | null;
  accumulated?: number | string | null;
  transaction_content: string;
  reference_number?: string | null;
  code?: string | null;
  bank_brand_name: string;
};

const SEPAY_API_BASE_URL = "https://userapi.sepay.vn";

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function isSepayWebhookAuthorized(request: Request) {
  const expected = process.env.SEPAY_WEBHOOK_API_KEY?.trim();
  const authorization = request.headers.get("authorization")?.trim();

  if (!expected || !authorization) return false;

  return secureEqual(authorization, `Apikey ${expected}`);
}

function parseTransactionDate(value: string) {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}+07:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function finitePositiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function toNullableNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function extractSepayApiRows(input: unknown): unknown[] {
  if (!input || typeof input !== "object") return [];

  const raw = input as Record<string, unknown>;
  if (Array.isArray(raw.data)) return raw.data;

  if (raw.data && typeof raw.data === "object") {
    const data = raw.data as Record<string, unknown>;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.transactions)) return data.transactions;
  }

  if (Array.isArray(raw.transactions)) return raw.transactions;
  return [];
}

export function mapSepayApiTransactionToWebhookPayload(
  input: unknown,
): SepayWebhookPayload | null {
  if (!input || typeof input !== "object") return null;

  const raw = input as Record<string, unknown>;
  const id = finitePositiveInteger(raw.id);
  const transactionDate =
    typeof raw.transaction_date === "string"
      ? raw.transaction_date.trim()
      : "";
  const accountNumber =
    typeof raw.account_number === "string" ? raw.account_number.trim() : "";
  const gateway =
    typeof raw.bank_brand_name === "string" ? raw.bank_brand_name.trim() : "";
  const content =
    typeof raw.transaction_content === "string"
      ? raw.transaction_content.trim()
      : "";
  const amountIn = finitePositiveInteger(raw.amount_in);
  const amountOut = finitePositiveInteger(raw.amount_out);
  const rawTransferType =
    typeof raw.transfer_type === "string"
      ? raw.transfer_type.trim().toLowerCase()
      : "";
  const transferType =
    rawTransferType === "out" || (!amountIn && amountOut) ? "out" : "in";
  const transferAmount = transferType === "in" ? amountIn : amountOut;

  if (!id || !transactionDate || !accountNumber || !gateway || !transferAmount) {
    return null;
  }

  return {
    id,
    gateway,
    transactionDate,
    accountNumber,
    code: typeof raw.code === "string" ? raw.code : null,
    content,
    transferType,
    transferAmount,
    accumulated: toNullableNumber(raw.accumulated),
    referenceCode:
      typeof raw.reference_number === "string" ? raw.reference_number : null,
  };
}

export async function fetchSepayRecentTransactions({
  query = "DRALVO",
  days = 3,
}: {
  query?: string;
  days?: number;
} = {}) {
  const token = process.env.SEPAY_API_TOKEN?.trim();
  const config = getVietQrConfig();

  if (!token) {
    throw new Error("SEPAY_API_TOKEN is not configured.");
  }

  if (!config.bankCode) {
    throw new Error("VIETQR_BANK_CODE is not configured.");
  }

  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const url = new URL("/v2/transactions", SEPAY_API_BASE_URL);
  url.searchParams.set("bank_brand_name", config.bankCode);
  url.searchParams.set("amount_in_min", "1");
  url.searchParams.set("transaction_date_from", from);
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SePay API returned ${response.status}.`);
  }

  const body = await response.json();
  return extractSepayApiRows(body)
    .map(mapSepayApiTransactionToWebhookPayload)
    .filter((row): row is SepayWebhookPayload => Boolean(row));
}

export function parseSepayWebhookPayload(
  input: unknown,
):
  | { ok: true; payment: ValidSepayPayment }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid JSON payload." };
  }

  const raw = input as Record<string, unknown>;
  const id = finitePositiveInteger(raw.id);
  const transferAmount = finitePositiveInteger(raw.transferAmount);
  const gateway = typeof raw.gateway === "string" ? raw.gateway.trim() : "";
  const accountNumber =
    typeof raw.accountNumber === "string" ? raw.accountNumber.trim() : "";
  const content = typeof raw.content === "string" ? raw.content.trim() : "";
  const transactionDate =
    typeof raw.transactionDate === "string" ? raw.transactionDate.trim() : "";
  const transactionAt = parseTransactionDate(transactionDate);
  const transferType = raw.transferType;

  if (!id || !transferAmount || !gateway || !accountNumber || !transactionAt) {
    return { ok: false, error: "Missing or invalid transaction fields." };
  }

  if (transferType !== "in") {
    return { ok: false, error: "Only incoming transfers are accepted." };
  }

  const config = getVietQrConfig();
  if (!config.bankCode || !config.accountNo) {
    return { ok: false, error: "SePay bank configuration is incomplete." };
  }

  if (gateway.toUpperCase() !== config.bankCode.toUpperCase()) {
    return { ok: false, error: "Unexpected bank gateway." };
  }

  if (
    normalizeBankAccount(accountNumber) !==
    normalizeBankAccount(config.accountNo)
  ) {
    return { ok: false, error: "Unexpected destination account." };
  }

  const reference = extractVietQrReference(
    [
      content,
      typeof raw.description === "string" ? raw.description : "",
      typeof raw.code === "string" ? raw.code : "",
    ].join(" "),
  );

  if (!reference) {
    return { ok: false, error: "Dralvo payment reference was not found." };
  }

  return {
    ok: true,
    payment: {
      reference,
      transactionAt,
      payload: {
        id,
        gateway,
        transactionDate,
        accountNumber,
        subAccount:
          typeof raw.subAccount === "string" ? raw.subAccount : null,
        code: typeof raw.code === "string" ? raw.code : null,
        content,
        transferType,
        description:
          typeof raw.description === "string" ? raw.description : null,
        transferAmount,
        accumulated:
          typeof raw.accumulated === "number" ? raw.accumulated : null,
        referenceCode:
          typeof raw.referenceCode === "string" ? raw.referenceCode : null,
      },
    },
  };
}
