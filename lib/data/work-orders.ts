import { refreshPendingScores } from "@/lib/actions/scoring";
import { db, check } from "./db";
import type { WorkOrder, AuditLog } from "./types";
export async function listWorkOrders() {
  await refreshPendingScores();
  const { data, error } = await db()
    .from("work_orders")
    .select("*")
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: false });
  check(error);
  return data as WorkOrder[];
}
export async function saveWorkOrder(
  id: string | null,
  values: Record<string, unknown>,
  actor: string,
) {
  const q = db(actor).from("work_orders");
  const { data, error } = await (
    id ? q.update(values).eq("id", id) : q.insert(values)
  )
    .select()
    .single();
  check(error);
  return data as WorkOrder;
}
export async function deleteWorkOrder(id: string, actor: string) {
  const { error } = await db(actor).from("work_orders").delete().eq("id", id);
  check(error);
}
export async function listAuditLogs() {
  const { data, error } = await db()
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  check(error);
  return data as AuditLog[];
}
