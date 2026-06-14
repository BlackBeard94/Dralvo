import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Alert, CreateAlertInput, UpdateAlertInput } from "@/types/alerts";

export async function getAlertsByUserId(userId: string): Promise<Alert[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase client not configured");

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);
  return data as Alert[];
}

export async function getAlertById(
  alertId: string,
  userId: string,
): Promise<Alert | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase client not configured");

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch alert: ${error.message}`);
  }
  return data as Alert;
}

export async function createAlert(
  userId: string,
  input: CreateAlertInput,
): Promise<Alert> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase client not configured");

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: userId,
      indicator_key: input.indicator_key,
      condition_json: input.condition_json,
      active: input.active ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create alert: ${error.message}`);
  return data as Alert;
}

export async function updateAlert(
  alertId: string,
  userId: string,
  input: UpdateAlertInput,
): Promise<Alert> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase client not configured");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.indicator_key !== undefined) updates.indicator_key = input.indicator_key;
  if (input.condition_json !== undefined) updates.condition_json = input.condition_json;
  if (input.active !== undefined) updates.active = input.active;

  const { data, error } = await supabase
    .from("alerts")
    .update(updates)
    .eq("id", alertId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update alert: ${error.message}`);
  return data as Alert;
}

export async function deleteAlert(
  alertId: string,
  userId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase client not configured");

  const { data, error } = await supabase
    .from("alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw new Error(`Failed to delete alert: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

export async function toggleAlert(
  alertId: string,
  userId: string,
  active: boolean,
): Promise<Alert> {
  return updateAlert(alertId, userId, { active });
}

