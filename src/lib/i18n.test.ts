import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  PRODUCT_COPY,
  SUPPORTED_LOCALES,
  normalizeLocale,
  withLocaleFallback,
} from "./i18n";

describe("i18n configuration", () => {
  it("supports the core three plus popular languages", () => {
    expect(SUPPORTED_LOCALES).toEqual([
      "vi",
      "en",
      "pt-BR",
      "es",
      "id",
      "ar",
    ]);
    expect(DEFAULT_LOCALE).toBe("vi");
  });

  it("normalizes browser locale variants", () => {
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("vi-VN")).toBe("vi");
    expect(normalizeLocale("es-MX")).toBe("es");
    expect(normalizeLocale("id-ID")).toBe("id");
    expect(normalizeLocale("ar-SA")).toBe("ar");
    expect(normalizeLocale("fr-FR")).toBe("vi");
  });

  it("falls back missing keys and untranslated locales to English copy", () => {
    const copy = withLocaleFallback<{ a: string; b: string }>({
      en: { a: "EN-A", b: "EN-B" },
      ar: { a: "AR-A" }, // `b` omitted -> should fall back to the English value.
    });
    // Provided key keeps the override; missing key falls back to English.
    expect(copy.ar.a).toBe("AR-A");
    expect(copy.ar.b).toBe("EN-B");
    // A locale with no override at all resolves to the full English entry.
    expect(copy.es.a).toBe("EN-A");
    expect(copy.es.b).toBe("EN-B");
  });

  it("has product copy for every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(PRODUCT_COPY[locale].primaryCta).toBeTruthy();
      expect(PRODUCT_COPY[locale].corePromise).toContain("Dralvo");
      expect(PRODUCT_COPY[locale].disclaimer).toBeTruthy();
    }
  });

  it("keeps human-readable locale labels and localized copy", () => {
    expect(PRODUCT_COPY.vi.primaryCta).toBe("Bắt đầu miễn phí");
    expect(PRODUCT_COPY["pt-BR"].primaryCta).toBe("Começar grátis");
  });
});
