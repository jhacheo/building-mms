import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const TENANT_COOKIE = "mms-workspace";
export type TenantRole =
  | "admin"
  | "building_manager"
  | "inspection_manager"
  | "technician"
  | "asset_manager";
export type Tenant = { id: string; name: string; role: TenantRole };
export type TenantMember = {
  user_id: string;
  display_name: string | null;
  role: TenantRole;
};

export const getAuthContext = cache(async () => {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || user.is_anonymous) redirect("/login");
  const { data, error: membershipError } = await client
    .from("tenant_members")
    .select("tenant_id,role,tenants(id,name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (membershipError)
    throw new Error("Could not load your workspaces. Please retry.");
  const tenants: Tenant[] = (data ?? []).flatMap((membership) => {
    const relation = membership.tenants as unknown as
      { id: string; name: string } | { id: string; name: string }[] | null;
    const tenant = Array.isArray(relation) ? relation[0] : relation;
    return tenant ? [{ ...tenant, role: membership.role as TenantRole }] : [];
  });
  const selected = (await cookies()).get(TENANT_COOKIE)?.value;
  // A cookie is a preference only. Membership is revalidated against RLS-protected rows.
  const activeTenantId =
    tenants.find((tenant) => tenant.id === selected)?.id ??
    tenants[0]?.id ??
    null;
  return { client, user, tenants, activeTenantId };
});

export const requireTenant = cache(async () => {
  const context = await getAuthContext();
  const tenant = context.tenants.find(
    (item) => item.id === context.activeTenantId,
  );
  if (!tenant) redirect("/onboarding");
  const { data, error } = await context.client
    .from("tenant_members")
    .select("user_id,display_name,role")
    .eq("tenant_id", tenant.id);
  if (error)
    throw new Error("Could not load your workspace team. Please retry.");
  return {
    ...context,
    tenant,
    role: tenant.role,
    members: (data ?? []) as TenantMember[],
  };
});
