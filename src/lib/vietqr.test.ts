import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createVietQrPaymentRequest,
  createVietQrReference,
  extractVietQrReference,
  sanitizeVietQrAddInfo,
} from "./vietqr";

describe("VietQR helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("creates a compact transfer reference", () => {
    const reference = createVietQrReference(new Date("2026-06-12T00:00:00Z"));
    expect(reference).toMatch(/^DRALVO260612[A-F0-9]{6}$/);
    expect(reference.length).toBeLessThanOrEqual(20);
  });

  it("sanitizes transfer content for VietQR constraints", () => {
    expect(sanitizeVietQrAddInfo("Dralvo Pro #123 - user")).toBe("DRALVOPRO123USER");
  });

  it("extracts a Dralvo reference from bank transfer content", () => {
    expect(
      extractVietQrReference("Thanh toan DRALVO260612ABCDEF cho goi pro"),
    ).toBe("DRALVO260612ABCDEF");
    expect(extractVietQrReference("unrelated transfer")).toBeNull();
  });

  it("generates a SePay VietQR URL", () => {
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "113366668888");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "DRALVO COMPANY");
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "webhook-key");
    vi.stubEnv("VIETQR_PRO_PRICE_VND", "499000");

    const request = createVietQrPaymentRequest({
      reference: "DRALVO260612ABCDEF",
    });

    expect(request).toMatchObject({
      reference: "DRALVO260612ABCDEF",
      amountVnd: 499000,
      addInfo: "DRALVO260612ABCDEF",
      qrCode: null,
    });
    const qrUrl = new URL(request.qrDataUrl!);
    expect(qrUrl.origin + qrUrl.pathname).toBe("https://qr.sepay.vn/img");
    expect(qrUrl.searchParams.get("bank")).toBe("ACB");
    expect(qrUrl.searchParams.get("acc")).toBe("113366668888");
    expect(qrUrl.searchParams.get("amount")).toBe("499000");
    expect(qrUrl.searchParams.get("des")).toBe("DRALVO260612ABCDEF");
  });
});
