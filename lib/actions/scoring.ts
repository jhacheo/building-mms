import { tenantDb, check } from "@/lib/data/db";
export async function refreshPendingScores() {
  const { client, tenantId } = await tenantDb();
  const { error } = await client.rpc("refresh_tenant_scores", {
    target_tenant: tenantId,
  });
  check(error);
}
export async function score_work_order(orderId: string) {
  await refreshPendingScores();
  const { client, tenantId } = await tenantDb();
  const { data, error } = await client
    .from("work_orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .single();
  check(error);
  return data;
}
