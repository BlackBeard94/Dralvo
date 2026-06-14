/**
 * Shared rate limiter for Twelve Data API calls.
 *
 * Twelve Data free tier: 800 requests/day (~33/hour, ~1 per 2 minutes sustained).
 * However, the API also has a short-term burst limit. Parallel calls from
 * fetchAllIndicators() trigger 429s. This module ensures Twelve Data calls
 * are spaced at least `MIN_INTERVAL_MS` apart globally.
 *
 * Usage:
 *   import { rateLimitedTwelveDataFetch } from "./twelve-data-limiter";
 *   const data = await rateLimitedTwelveDataFetch(url);
 */

const MIN_INTERVAL_MS = 2500; // 2.5s between Twelve Data calls (free tier: 8 req/min)
const DEFAULT_TIMEOUT_MS = 12_000;

let lastCallTime = 0;
let queue = Promise.resolve();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random jitter between 0 and maxMs to avoid thundering herd. */
function jitter(maxMs: number): number {
  return Math.floor(Math.random() * maxMs);
}

/**
 * Fetch a Twelve Data URL with global rate limiting.
 * Ensures at least MIN_INTERVAL_MS + random jitter between consecutive calls.
 */
export async function rateLimitedTwelveDataFetch(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const execute = queue.then(async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < MIN_INTERVAL_MS) {
      const waitMs = MIN_INTERVAL_MS - timeSinceLastCall + jitter(500);
      await delay(waitMs);
    }

    lastCallTime = Date.now();
    const requestInit = {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
    };
    return fetch(url, requestInit);
  });

  queue = execute.then(
    () => undefined,
    () => undefined,
  );

  return execute;
}

