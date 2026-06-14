import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
  sendEmail: vi.fn(),
  sendTelegramMessage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

vi.mock("./email", async () => {
  const actual = await vi.importActual<typeof import("./email")>("./email");
  return {
    ...actual,
    sendEmail: mocks.sendEmail,
  };
});

vi.mock("./telegram", async () => {
  const actual = await vi.importActual<typeof import("./telegram")>("./telegram");
  return {
    ...actual,
    sendTelegramMessage: mocks.sendTelegramMessage,
  };
});

import { evaluateAndDispatch } from "./dispatch";
import type { Alert } from "@/types/alerts";

const alert: Alert = {
  id: "alert-1",
  user_id: "user-1",
  indicator_key: "xauusd-spot",
  condition_json: { operator: "gt", value: 4300 },
  active: true,
  created_at: "2026-06-11T00:00:00Z",
  updated_at: "2026-06-11T00:00:00Z",
};

const snapshot = {
  key: "xauusd-spot",
  name: "XAUUSD Spot",
  source: "test",
  cadence: "test",
  value: "$4,350.00",
  change: "+1.2%",
  status: "bullish",
  summary: "test",
  observedAt: "2026-06-11T00:00:00Z",
  observedLabel: "Jun 11",
};

function createSupabaseMock({
  triggerStates = [],
  snapshotValue = "$4,350.00",
  activeAlert = alert,
  thesisState = "supportive",
  relationshipState = "diverging",
}: {
  triggerStates?: unknown[];
  snapshotValue?: string;
  activeAlert?: Alert;
  thesisState?: string;
  relationshipState?: string;
} = {}) {
  const currentSnapshot = { ...snapshot, value: snapshotValue };
  const upsertTriggerState = vi.fn().mockResolvedValue({ error: null });
  const insertNotification = vi.fn().mockResolvedValue({ error: null });
  const triggerStateEq = vi.fn().mockResolvedValue({ error: null });
  const updateTriggerState = vi.fn(() => ({
    eq: triggerStateEq,
  }));

  const client = {
    from: vi.fn((table: string) => {
      if (table === "alerts") {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn().mockResolvedValue({ data: [activeAlert], error: null }),
        };
        return query;
      }

      if (table === "indicator_snapshots") {
        const query = {
          select: vi.fn(() => query),
          in: vi.fn(() => query),
          order: vi.fn().mockResolvedValue({
            data: [{ indicator_key: "xauusd-spot", value_json: currentSnapshot }],
            error: null,
          }),
        };
        return query;
      }

      if (table === "alert_trigger_state") {
        const query = {
          select: vi.fn(() => query),
          in: vi.fn().mockResolvedValue({ data: triggerStates, error: null }),
          upsert: upsertTriggerState,
          update: updateTriggerState,
        };
        return query;
      }

      if (table === "thesis_snapshots") {
        const query = {
          select: vi.fn(() => query),
          order: vi.fn(() => query),
          limit: vi.fn(() => query),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              thesis_json: {
                state: thesisState,
                priceRelationship: {
                  state: relationshipState,
                },
                drivers: [],
              },
            },
            error: null,
          }),
        };
        return query;
      }

      if (table === "profiles") {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "user-1",
              email: "user@example.com",
              telegram_chat_id: "123456",
              notification_prefs: {
                email: true,
                telegram: true,
                in_app: true,
              },
            },
            error: null,
          }),
        };
        return query;
      }

      if (table === "alert_notifications") {
        return {
          insert: insertNotification,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return {
    client,
    insertNotification,
    upsertTriggerState,
    updateTriggerState,
    triggerStateEq,
  };
}

describe("evaluateAndDispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendEmail.mockResolvedValue(true);
    mocks.sendTelegramMessage.mockResolvedValue(true);
  });

  it("dispatches email, Telegram, and in-app notifications for newly triggered alerts", async () => {
    const db = createSupabaseMock();
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const result = await evaluateAndDispatch();

    expect(result).toEqual({
      evaluated: 1,
      triggered: 1,
      dispatched: { email: 1, telegram: 1, in_app: 1 },
      errors: [],
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: expect.stringContaining("Dralvo"),
      }),
    );
    expect(mocks.sendTelegramMessage).toHaveBeenCalledWith(
      "123456",
      expect.stringContaining("XAUUSD Spot"),
    );
    expect(db.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        alert_id: "alert-1",
        indicator_key: "xauusd-spot",
        triggered_value: "$4,350.00",
      }),
    );
  });

  it("does not dispatch again while an alert remains triggered", async () => {
    const db = createSupabaseMock({
      triggerStates: [
        {
          alert_id: "alert-1",
          indicator_key: "xauusd-spot",
          last_triggered_value: 4350,
          last_value: "4350",
          last_triggered_at: "2026-06-11T00:00:00Z",
          is_triggered: true,
        },
      ],
    });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const result = await evaluateAndDispatch();

    expect(result.triggered).toBe(0);
    expect(result.dispatched).toEqual({ email: 0, telegram: 0, in_app: 0 });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.sendTelegramMessage).not.toHaveBeenCalled();
    expect(db.insertNotification).not.toHaveBeenCalled();
  });

  it("resets trigger state when a previously triggered condition turns false", async () => {
    const db = createSupabaseMock({
      snapshotValue: "$4,250.00",
      triggerStates: [
        {
          alert_id: "alert-1",
          indicator_key: "xauusd-spot",
          last_triggered_value: 4350,
          last_value: "4350",
          last_triggered_at: "2026-06-11T00:00:00Z",
          is_triggered: true,
        },
      ],
    });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const result = await evaluateAndDispatch();

    expect(result.triggered).toBe(0);
    expect(result.dispatched).toEqual({ email: 0, telegram: 0, in_app: 0 });
    expect(db.updateTriggerState).toHaveBeenCalledWith(
      expect.objectContaining({
        is_triggered: false,
        last_value: "4250",
      }),
    );
    expect(db.triggerStateEq).toHaveBeenCalledWith("alert_id", "alert-1");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("dispatches a thesis-state monitor through the existing channels", async () => {
    const thesisAlert: Alert = {
      ...alert,
      id: "thesis-alert-1",
      indicator_key: "thesis:overall",
      condition_json: { operator: "state_is", state: "supportive" },
    };
    const db = createSupabaseMock({ activeAlert: thesisAlert });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const result = await evaluateAndDispatch();

    expect(result.triggered).toBe(1);
    expect(result.dispatched).toEqual({ email: 1, telegram: 1, in_app: 1 });
    expect(db.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        alert_id: "thesis-alert-1",
        indicator_key: "thesis:overall",
        indicator_name: "Gold thesis state",
        triggered_value: "supportive",
      }),
    );
  });

  it("dispatches a price-divergence monitor through the existing channels", async () => {
    const divergenceAlert: Alert = {
      ...alert,
      id: "divergence-alert-1",
      indicator_key: "thesis:price-relationship",
      condition_json: { operator: "state_is", state: "diverging" },
    };
    const db = createSupabaseMock({ activeAlert: divergenceAlert });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const result = await evaluateAndDispatch();

    expect(result.triggered).toBe(1);
    expect(result.dispatched).toEqual({ email: 1, telegram: 1, in_app: 1 });
    expect(db.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        alert_id: "divergence-alert-1",
        indicator_key: "thesis:price-relationship",
        indicator_name: "Price vs fundamental relationship",
        triggered_value: "diverging",
      }),
    );
  });
});
