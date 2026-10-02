import { tenantDb, check } from "./db";
import type { Property } from "./types";
export async function listProperties() {
  const { client, tenantId } = await tenantDb();
  const { data, error } = await client
    .from("properties")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");
  check(error);
  return data as Property[];
}
export async function saveProperty(
  id: string | null,
  values: Record<string, unknown>,
) {
  const { client, tenantId } = await tenantDb();
  const q = client.from("properties");
  const { error } = await (
    id
      ? q.update(values).eq("id", id).eq("tenant_id", tenantId)
      : q.insert({ ...values, tenant_id: tenantId })
  )
    .select("id")
    .single();
  check(error);
}
export async function deleteProperty(id: string) {
  const { client, tenantId } = await tenantDb();
  const { error } = await client
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("id")
    .single();
  check(error);
}
