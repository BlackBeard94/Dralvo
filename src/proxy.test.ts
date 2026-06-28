import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

function request(url: string) {
  return new NextRequest(url);
}

function mockUser(user: { id: string } | null) {
  createServerClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  } as never);
}

describe("proxy auth redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  it("preserves protected-route query strings in the login redirect", async () => {
    mockUser(null);

    const response = await proxy(
      request("https://www.dralvo.com/dashboard?checkout=success"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/login?redirect=%2Fdashboard%3Fcheckout%3Dsuccess",
    );
  });

  it("sends authenticated users from login to a safe internal redirect with query", async () => {
    mockUser({ id: "user-1" });

    const response = await proxy(
      request(
        "https://www.dralvo.com/login?redirect=%2Fapi%2Fstripe%2Fcheckout%3Fintent%3Dpro",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/api/stripe/checkout?intent=pro",
    );
  });

  it("rejects external redirects for authenticated users on auth pages", async () => {
    mockUser({ id: "user-1" });

    const response = await proxy(
      request(
        "https://www.dralvo.com/login?redirect=https%3A%2F%2Fevil.example%2Fcheckout",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/dashboard",
    );
  });

});
