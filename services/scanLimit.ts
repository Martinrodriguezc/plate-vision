import { supabase } from "./supabase";
import { Config } from "../constants/Config";

/**
 * Cuenta los escaneos del usuario hoy (hora local).
 * Usa la tabla scans con created_at >= inicio del dia.
 */
export async function getTodayScansCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString());

  if (error) return 0;
  return count ?? 0;
}

export async function canScanToday(isPro: boolean): Promise<{
  allowed: boolean;
  remaining: number;
  total: number;
}> {
  if (isPro) {
    return { allowed: true, remaining: Infinity, total: Infinity };
  }

  const used = await getTodayScansCount();
  const remaining = Math.max(0, Config.FREE_SCANS_PER_DAY - used);

  return {
    allowed: remaining > 0,
    remaining,
    total: Config.FREE_SCANS_PER_DAY,
  };
}
