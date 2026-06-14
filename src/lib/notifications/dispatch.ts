import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmail, buildAlertEmail } from "./email";
import { sendTelegramMessage, buildAlertTelegramMessage } from "./telegram";
import {
  evaluateCondition,
  evaluateStateCondition,
  extractNumericValue,
  needsPreviousValue,
} from "./evaluate";
import type { Alert, AlertCondition } from "@/types/alerts";
import type { IndicatorSnapshot } from "@/data/indicators";
import type { GoldThesis } from "@/lib/intelligence/gold-thesis";

//  Types 
type Profile = {
  id: string;
  email: string | null;
  telegram_chat_id: string | null;
  notification_prefs: {
    email?: boolean;
    telegram?: boolean;
    in_app?: boolean;
  } | null;
};

type TriggerState = {
  alert_id: string;
  indicator_key: string;
  last_triggered_value: number | null;
  last_value: string | null;
  last_triggered_at: string | null;
  is_triggered: boolean;
};

//  Format condition for display 
function formatConditionText(condition: AlertCondition): string {
  const { operator, value, min, max } = condition;
  switch (operator) {
    case "gt": return `> ${value}`;
    case "lt": return `< ${value}`;
    case "gte": return `>= ${value}`;
    case "lte": return `<= ${value}`;
    case "eq": return `= ${value}`;
    case "between": return `${min} - ${max}`;
    case "cross_above": return `cross above ${value}`;
    case "cross_below": return `cross below ${value}`;
    case "state_is": return `state is ${condition.state?.replace("_", " ")}`;
    default: return operator;
  }
}

//  Main dispatch function 
// Called by the cron endpoint every 5 minutes.
// 1. Fetches all active alerts
// 2. Fetches latest indicator snapshots for each indicator key
// 3. Evaluates each alert against its indicator's current value
// 4. Checks dedup state (alert_trigger_state table)
// 5. Dispatches notifications to users who have them enabled
export async function evaluateAndDispatch(): Promise<{
  evaluated: number;
  triggered: number;
  dispatched: { email: number; telegram: number; in_app: number };
  errors: string[];
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      evaluated: 0,
      triggered: 0,
      dispatched: { email: 0, telegram: 0, in_app: 0 },
      errors: ["Supabase admin client unavailable"],
    };
  }
  const db = supabase;

  const errors: string[] = [];
  let evaluated = 0;
  let triggered = 0;
  const dispatched = { email: 0, telegram: 0, in_app: 0 };

  //  1. Fetch all active alerts 
  const { data: alerts, error: alertsErr } = await supabase
    .from("alerts")
    .select("*")
    .eq("active", true);

  if (alertsErr) {
    errors.push(`Failed to fetch alerts: ${alertsErr.message}`);
    return { evaluated: 0, triggered: 0, dispatched, errors };
  }

  if (!alerts || alerts.length === 0) {
    return { evaluated: 0, triggered: 0, dispatched, errors };
  }

  //  2. Get unique indicator keys and fetch latest snapshots 
  const indicatorKeys = [...new Set(alerts.map((a) => a.indicator_key))];
  const numericKeys = indicatorKeys.filter((key) => !key.startsWith("thesis:"));
  const thesisKeys = indicatorKeys.filter((key) => key.startsWith("thesis:"));

  let snapshots: Array<{
    indicator_key: string;
    value_json: IndicatorSnapshot;
  }> = [];
  if (numericKeys.length > 0) {
    const { data, error: snapErr } = await supabase
      .from("indicator_snapshots")
      .select("*")
      .in("indicator_key", numericKeys)
      .order("observed_at", { ascending: false });

    if (snapErr) {
      errors.push(`Failed to fetch snapshots: ${snapErr.message}`);
      return { evaluated: 0, triggered: 0, dispatched, errors };
    }
    snapshots = (data ?? []) as typeof snapshots;
  }

  // Build a map: indicator_key  latest snapshot
  const snapshotMap = new Map<string, IndicatorSnapshot>();
  for (const row of snapshots ?? []) {
    if (!snapshotMap.has(row.indicator_key)) {
      const valueJson = row.value_json as IndicatorSnapshot;
      snapshotMap.set(row.indicator_key, valueJson);
    }
  }

  let latestThesis: GoldThesis | null = null;
  if (thesisKeys.length > 0) {
    const { data, error: thesisError } = await supabase
      .from("thesis_snapshots")
      .select("thesis_json")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (thesisError) {
      errors.push(`Failed to fetch thesis snapshot: ${thesisError.message}`);
    } else {
      latestThesis = (data?.thesis_json as GoldThesis | undefined) ?? null;
    }
  }

  //  3. Fetch trigger states for dedup 
  const { data: triggerStates } = await supabase
    .from("alert_trigger_state")
    .select("*")
    .in(
      "alert_id",
      alerts.map((a) => a.id),
    );

  const triggerMap = new Map<string, TriggerState>();
  for (const ts of triggerStates ?? []) {
    triggerMap.set(ts.alert_id, ts as TriggerState);
  }

  //  4. Evaluate each alert 
  for (const alert of alerts) {
    evaluated++;
    const condition = alert.condition_json as AlertCondition;
    const triggerState = triggerMap.get(alert.id);
    const thesisTarget = alert.indicator_key.startsWith("thesis:");

    let currentValue: number | null = null;
    let currentObservedValue: string;
    let indicatorName: string;
    let isTriggered: boolean;

    if (thesisTarget) {
      if (!latestThesis) continue;
      const target = alert.indicator_key.slice("thesis:".length);
      const currentState =
        target === "overall"
          ? latestThesis.state
          : target === "price-relationship"
            ? latestThesis.priceRelationship?.state
          : latestThesis.drivers.find((driver) => driver.driverKey === target)
              ?.state;
      if (!currentState) continue;

      currentObservedValue = currentState;
      indicatorName =
        target === "overall"
          ? "Gold thesis state"
          : target === "price-relationship"
            ? "Price vs fundamental relationship"
          : latestThesis.drivers.find((driver) => driver.driverKey === target)
              ?.label ?? target;
      isTriggered = evaluateStateCondition(currentState, condition);
    } else {
      const snapshot = snapshotMap.get(alert.indicator_key);
      if (!snapshot) continue;
      currentValue = extractNumericValue(snapshot);
      if (currentValue === null) continue;
      currentObservedValue = String(currentValue);
      indicatorName = snapshot.name ?? alert.indicator_key;

      let previousValue: number | undefined;
      if (needsPreviousValue(condition)) {
        const parsedPrevious = triggerState?.last_value
          ? parseFloat(triggerState.last_value)
          : Number.NaN;
        previousValue = Number.isNaN(parsedPrevious) ? undefined : parsedPrevious;
      }
      isTriggered = evaluateCondition(currentValue, condition, previousValue);
    }

    async function updateObservedValue(isTriggeredValue: boolean) {
      await db.from("alert_trigger_state").upsert(
        {
          alert_id: alert.id,
          indicator_key: alert.indicator_key,
          last_value: currentObservedValue,
          is_triggered: isTriggeredValue,
        },
        { onConflict: "alert_id" },
      );
    }

    //  Dedup logic 
    // If already triggered and condition still true  skip (no repeat)
    // If already triggered and condition now false  reset state
    // If not triggered and condition true  fire notification
    if (isTriggered && triggerState?.is_triggered) {
      await updateObservedValue(true);
      continue;
    }

    if (!isTriggered && triggerState?.is_triggered) {
      await supabase
        .from("alert_trigger_state")
        .update({
          is_triggered: false,
          last_value: currentObservedValue,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("alert_id", alert.id);
      continue;
    }

    if (!isTriggered) {
      await updateObservedValue(false);
      continue;
    }

    //  5. TRIGGERED! Dispatch notifications 
    triggered++;

    // Update trigger state
    await supabase.from("alert_trigger_state").upsert(
      {
        alert_id: alert.id,
        indicator_key: alert.indicator_key,
        last_triggered_value: currentValue,
        last_value: currentObservedValue,
        last_triggered_at: new Date().toISOString(),
        is_triggered: true,
      },
      { onConflict: "alert_id" },
    );

    // Fetch user profile for notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, telegram_chat_id, notification_prefs")
      .eq("id", alert.user_id)
      .single();

    if (!profile) continue;

    const prefs = (profile as Profile).notification_prefs ?? {};
    const conditionText = formatConditionText(condition);

    //  Email 
    if (prefs.email !== false && profile.email) {
      const emailPayload = buildAlertEmail({
        indicatorName,
        conditionText,
        triggeredValue: thesisTarget
          ? currentObservedValue.replace("_", " ")
          : snapshotMap.get(alert.indicator_key)?.value ?? currentObservedValue,
        alertId: alert.id,
      });
      emailPayload.to = profile.email;
      const sent = await sendEmail(emailPayload);
      if (sent) dispatched.email++;
    }

    //  Telegram 
    if (prefs.telegram === true && profile.telegram_chat_id) {
      const msg = buildAlertTelegramMessage({
        indicatorName,
        conditionText,
        triggeredValue: thesisTarget
          ? currentObservedValue.replace("_", " ")
          : snapshotMap.get(alert.indicator_key)?.value ?? currentObservedValue,
      });
      const sent = await sendTelegramMessage(profile.telegram_chat_id, msg);
      if (sent) dispatched.telegram++;
    }

    //  In-app 
    if (prefs.in_app !== false) {
      const { error: notifErr } = await supabase
        .from("alert_notifications")
        .insert({
          user_id: alert.user_id,
          alert_id: alert.id,
          indicator_key: alert.indicator_key,
          indicator_name: indicatorName,
          condition_json: condition,
          condition_text: conditionText,
          triggered_value: thesisTarget
            ? currentObservedValue.replace("_", " ")
            : snapshotMap.get(alert.indicator_key)?.value ?? currentObservedValue,
          triggered_at: new Date().toISOString(),
          read: false,
        });

      if (!notifErr) dispatched.in_app++;
      else errors.push(`In-app insert failed for alert ${alert.id}: ${notifErr.message}`);
    }
  }

  return { evaluated, triggered, dispatched, errors };
}

