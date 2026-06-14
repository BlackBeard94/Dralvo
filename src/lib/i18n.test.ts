import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  PRODUCT_COPY,
  SUPPORTED_LOCALES,
  normalizeLocale,
} from "./i18n";

describe("i18n configuration", () => {
  it("requires Vietnamese, English, and Brazilian Portuguese", () => {
    expect(SUPPORTED_LOCALES).toEqual(["vi", "en", "pt-BR"]);
    expect(DEFAULT_LOCALE).toBe("vi");
  });

  it("normalizes browser locale variants", () => {
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("vi-VN")).toBe("vi");
    expect(normalizeLocale("fr-FR")).toBe("vi");
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
