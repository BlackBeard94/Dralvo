import { afterEach, describe, expect, it } from "vitest";

import { isCronAuthorized } from "@/lib/api-auth";

const originalSecret = process.env.CRON_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env["CRON_SECRET"] = originalSecret;
  }
});

describe("isCronAuthorized", () => {
  it("accepts the configured bearer token", () => {
    process.env["CRON_SECRET"] = "test-cron-secret";
    const request = new Request("https://www.dralvo.com/api/health", {
      headers: { authorization: "Bearer test-cron-secret" },
    });

    expect(isCronAuthorized(request)).toBe(true);
  });

  it("rejects spoofed Vercel cron headers and query-string secrets", () => {
    process.env["CRON_SECRET"] = "test-cron-secret";
    const cronHeader = new Request("https://www.dralvo.com/api/health", {
      headers: { "x-vercel-cron": "1" },
    });
    const querySecret = new Request(
      "https://www.dralvo.com/api/health?secret=test-cron-secret",
    );

    expect(isCronAuthorized(cronHeader)).toBe(false);
    expect(isCronAuthorized(querySecret)).toBe(false);
  });

  it("fails closed when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET;
    const request = new Request("https://www.dralvo.com/api/health", {
      headers: { authorization: "Bearer anything" },
    });

    expect(isCronAuthorized(request)).toBe(false);
  });
});
