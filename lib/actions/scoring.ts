import { db, check } from "@/lib/data/db";
// SQL trigger is the authoritative scorer; this refreshes time-dependent rules.
export async function score_work_order(orderId: string) {
  const { data, error } = await db()
    .from("work_orders")
    .update({ priority_source: "rule_engine" })
    .eq("id", orderId)
    .select()
    .single();
  check(error);
  return data;
}
export async function refreshPendingScores() {
  const cutoff = new Date(Date.now() - 48 * 3600000).toISOString();
  const { error } = await db()
    .from("work_orders")
    .update({ priority_source: "rule_engine" })
    .eq("status", "pending")
    .lt("created_at", cutoff);
  check(error);
}
