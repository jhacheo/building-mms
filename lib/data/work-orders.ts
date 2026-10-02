import { refreshPendingScores } from "@/lib/actions/scoring";
import { tenantDb, check } from "./db";
import type { WorkOrder, AuditLog } from "./types";
export async function listWorkOrders() {
  await refreshPendingScores();
  const { client, tenantId } = await tenantDb();
  const { data, error } = await client
    .from("work_orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: false });
  check(error);
  return data as WorkOrder[];
}
export async function saveWorkOrder(
  id: string | null,
  values: Record<string, unknown>,
) {
  const { client, tenantId } = await tenantDb();
  const q = client.from("work_orders");
  const { data, error } = await (
    id
      ? q.update(values).eq("id", id).eq("tenant_id", tenantId)
      : q.insert({ ...values, tenant_id: tenantId })
  )
    .select()
    .single();
  check(error);
  return data as WorkOrder;
}
export async function deleteWorkOrder(id: string) {
  const { client, tenantId } = await tenantDb();
  const { error } = await client
    .from("work_orders")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("id")
    .single();
  check(error);
}
export async function listAuditLogs() {
  const { client, tenantId } = await tenantDb();
  const { data, error } = await client
    .from("audit_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);
  check(error);
  return data as AuditLog[];
}
