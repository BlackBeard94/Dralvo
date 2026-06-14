import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimitedTwelveDataFetch: vi.fn(),
}));

vi.mock("@/data/ingestion/twelve-data-limiter", () => ({
  rateLimitedTwelveDataFetch: mocks.rateLimitedTwelveDataFetch,
}));

import { fetchXauusdSma } from "./xauusd-sma";

function responseFor(value: number) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      values: [{ datetime: "2026-06-11", sma: String(value) }],
    }),
  } as unknown as Response;
}

describe("fetchXauusdSma", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWELVE_DATA_API_KEY = "test-key";
  });

  it("schedules SMA 50 and SMA 200 fetches and builds a snapshot", async () => {
    mocks.rateLimitedTwelveDataFetch.mockImplementation((url: string) => {
      return Promise.resolve(url.includes("time_period=50")
        ? responseFor(4300)
        : responseFor(4100));
    });

    const result = await fetchXauusdSma();

    expect(mocks.rateLimitedTwelveDataFetch).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.value).toBe("SMA50: $4300 | SMA200: $4100");
      expect(result.data.status).toBe("bullish");
      expect(result.data.dataQuality).toBe("delayed");
    }
  });

  it("retries a transient failed SMA request once", async () => {
    let sma50Attempts = 0;
    mocks.rateLimitedTwelveDataFetch.mockImplementation((url: string) => {
      if (url.includes("time_period=50")) {
        sma50Attempts += 1;
        if (sma50Attempts === 1) {
          return Promise.reject(new Error("temporary timeout"));
        }
        return Promise.resolve(responseFor(4300));
      }
      return Promise.resolve(responseFor(4100));
    });

    const result = await fetchXauusdSma();

    expect(result.status).toBe("success");
    expect(sma50Attempts).toBe(2);
    expect(mocks.rateLimitedTwelveDataFetch).toHaveBeenCalledTimes(3);
  });

  it("honors a rate-limit response and retries the affected SMA request", async () => {
    let sma200Attempts = 0;
    mocks.rateLimitedTwelveDataFetch.mockImplementation((url: string) => {
      if (url.includes("time_period=200")) {
        sma200Attempts += 1;
        if (sma200Attempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers({ "retry-after": "0" }),
          } as Response);
        }
        return Promise.resolve(responseFor(4100));
      }
      return Promise.resolve(responseFor(4300));
    });

    const result = await fetchXauusdSma();

    expect(result.status).toBe("success");
    expect(sma200Attempts).toBe(2);
  });
});
