import { requireTenant } from "@/lib/auth/tenant";
export async function db() {
  return (await requireTenant()).client;
}
export async function tenantDb() {
  const context = await requireTenant();
  return { client: context.client, tenantId: context.tenant.id };
}
export function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "23503")
    throw new Error(
      "Linked records must belong to this workspace. Remove dependent records before deleting.",
    );
  if (error.code === "42501")
    throw new Error("Your workspace role does not permit this action.");
  throw new Error(error.message);
}
