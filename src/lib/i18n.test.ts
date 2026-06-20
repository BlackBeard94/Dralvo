import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  PRODUCT_COPY,
  SUPPORTED_LOCALES,
  normalizeLocale,
} from "./i18n";

describe("i18n configuration", () => {
  it("supports the core three plus popular languages", () => {
    expect(SUPPORTED_LOCALES).toEqual([
      "vi",
      "en",
      "pt-BR",
      "zh",
      "es",
      "hi",
      "id",
      "ru",
    ]);
    expect(DEFAULT_LOCALE).toBe("vi");
  });

  it("normalizes browser locale variants", () => {
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("vi-VN")).toBe("vi");
    expect(normalizeLocale("zh-CN")).toBe("zh");
    expect(normalizeLocale("es-MX")).toBe("es");
    expect(normalizeLocale("hi-IN")).toBe("hi");
    expect(normalizeLocale("id-ID")).toBe("id");
    expect(normalizeLocale("ru-RU")).toBe("ru");
    expect(normalizeLocale("fr-FR")).toBe("vi");
  });

  it("falls back untranslated locales to English copy", () => {
    // zh has no PRODUCT_COPY translation yet -> should equal the English entry.
    expect(PRODUCT_COPY.zh.primaryCta).toBe(PRODUCT_COPY.en.primaryCta);
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
