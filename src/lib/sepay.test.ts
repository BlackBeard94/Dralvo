import { afterEach, describe, expect, it, vi } from "vitest";

import {
  mapSepayApiTransactionToWebhookPayload,
  isSepayWebhookAuthorized,
  parseSepayWebhookPayload,
} from "./sepay";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: 92704,
    gateway: "ACB",
    transactionDate: "2026-06-13 16:30:00",
    accountNumber: "260234939",
    subAccount: null,
    code: null,
    content: "DRALVO260613ABCDEF thanh toan",
    transferType: "in",
    description: "Payment",
    transferAmount: 499000,
    accumulated: 1000000,
    referenceCode: "FT2606130001",
    ...overrides,
  };
}

describe("SePay webhook helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("authenticates the official API Key header format", () => {
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "test-key");

    expect(
      isSepayWebhookAuthorized(
        new Request("https://dralvo.test/api/sepay/webhook", {
          headers: { authorization: "Apikey test-key" },
        }),
      ),
    ).toBe(true);
    expect(
      isSepayWebhookAuthorized(
        new Request("https://dralvo.test/api/sepay/webhook", {
          headers: { authorization: "Bearer test-key" },
        }),
      ),
    ).toBe(false);
  });

  it("accepts a matching incoming ACB transfer", () => {
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "260234939");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "TRINH DINH HUAN");
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "test-key");

    const result = parseSepayWebhookPayload(payload());

    expect(result).toMatchObject({
      ok: true,
      payment: {
        reference: "DRALVO260613ABCDEF",
        transactionAt: "2026-06-13T09:30:00.000Z",
        payload: {
          id: 92704,
          transferAmount: 499000,
        },
      },
    });
  });

  it("rejects outgoing transfers and unexpected accounts", () => {
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "260234939");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "TRINH DINH HUAN");
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "test-key");

    expect(
      parseSepayWebhookPayload(payload({ transferType: "out" })),
    ).toEqual({
      ok: false,
      error: "Only incoming transfers are accepted.",
    });
    expect(
      parseSepayWebhookPayload(payload({ accountNumber: "000000000" })),
    ).toEqual({
      ok: false,
      error: "Unexpected destination account.",
    });
  });

  it("requires a Dralvo payment reference", () => {
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "260234939");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "TRINH DINH HUAN");
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "test-key");

    expect(
      parseSepayWebhookPayload(
        payload({ content: "transfer without order reference" }),
      ),
    ).toEqual({
      ok: false,
      error: "Dralvo payment reference was not found.",
    });
  });

  it("maps SePay API v2 transactions into the webhook payload contract", () => {
    expect(
      mapSepayApiTransactionToWebhookPayload({
        id: 123456,
        transaction_date: "2026-06-13 21:00:00",
        account_number: "260234939",
        transfer_type: "in",
        amount_in: "499000",
        amount_out: "0",
        accumulated: "1000000",
        transaction_content: "DRALVO260613ABCDEF",
        reference_number: "FT2606130002",
        code: "CODE1",
        bank_brand_name: "ACB",
      }),
    ).toEqual({
      id: 123456,
      gateway: "ACB",
      transactionDate: "2026-06-13 21:00:00",
      accountNumber: "260234939",
      code: "CODE1",
      content: "DRALVO260613ABCDEF",
      transferType: "in",
      transferAmount: 499000,
      accumulated: 1000000,
      referenceCode: "FT2606130002",
    });
  });
});
