import { tenantDb, check } from "./db";
import type { Asset } from "./types";
export async function listAssets() {
  const { client, tenantId } = await tenantDb();
  const { data, error } = await client
    .from("assets")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");
  check(error);
  return data as Asset[];
}
export async function saveAsset(
  id: string | null,
  values: Record<string, unknown>,
) {
  const { client, tenantId } = await tenantDb();
  const q = client.from("assets");
  const { error } = await (
    id
      ? q.update(values).eq("id", id).eq("tenant_id", tenantId)
      : q.insert({ ...values, tenant_id: tenantId })
  )
    .select("id")
    .single();
  check(error);
}
export async function deleteAsset(id: string) {
  const { client, tenantId } = await tenantDb();
  const { error } = await client
    .from("assets")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("id")
    .single();
  check(error);
}
