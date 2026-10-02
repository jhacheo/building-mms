"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext, requireTenant, TENANT_COOKIE } from "./tenant";

export type AuthState = { error?: string; message?: string };
const value = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function login(
  _state: AuthState,
  form: FormData,
): Promise<AuthState> {
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword({
    email: value(form, "email"),
    password: String(form.get("password") ?? ""),
  });
  if (error)
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirm your email using the link in your inbox, then sign in."
          : "Could not sign in. Check your email and password, or confirm your email first.",
    };
  redirect("/");
}

export async function signup(
  _state: AuthState,
  form: FormData,
): Promise<AuthState> {
  const email = value(form, "email"),
    password = String(form.get("password") ?? "");
  if (!email || password.length < 8)
    return {
      error: "Enter your email and a password with at least 8 characters.",
    };
  const client = await createClient();
  // This origin is deployment configuration, never a caller-provided redirect.
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL || "https://building-mms.vercel.app";
  const emailRedirectTo = new URL(
    "/auth/callback",
    configuredOrigin,
  ).toString();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error)
    return {
      error:
        "Could not create your account. Try again or sign in if you already have an account. If email delivery is unavailable, contact your workspace administrator.",
    };
  if (data.session) redirect("/onboarding");
  return {
    message:
      "Check your inbox for the confirmation link, then return here to sign in. If you already registered, use your existing account.",
  };
}

export async function createTenant(
  _state: AuthState,
  form: FormData,
): Promise<AuthState> {
  const { client } = await getAuthContext();
  const name = value(form, "name"),
    memberName = value(form, "member_name");
  if (!name || name.length > 120 || memberName.length > 120)
    return {
      error:
        "Enter a workspace name and a display name of up to 120 characters.",
    };
  const { data, error } = await client.rpc("create_tenant", {
    tenant_name: name,
    member_name: memberName || null,
  });
  if (error || typeof data !== "string")
    return {
      error: error?.message ?? "Could not create your workspace. Please retry.",
    };
  (await cookies()).set(TENANT_COOKIE, data, cookieOptions);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function selectTenant(form: FormData) {
  const { tenants } = await getAuthContext();
  const id = value(form, "tenant_id");
  if (!tenants.some((tenant) => tenant.id === id))
    throw new Error("You do not belong to that workspace.");
  (await cookies()).set(TENANT_COOKIE, id, cookieOptions);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function addMember(
  _state: AuthState,
  form: FormData,
): Promise<AuthState> {
  const { client, tenant, role } = await requireTenant();
  if (role !== "admin")
    return { error: "Only a workspace administrator can add team members." };
  const memberRole = value(form, "role");
  if (
    ![
      "admin",
      "building_manager",
      "inspection_manager",
      "technician",
      "asset_manager",
    ].includes(memberRole)
  )
    return { error: "Select a valid team role." };
  const { error } = await client.rpc("add_tenant_member", {
    target_tenant: tenant.id,
    member_email: value(form, "email"),
    member_role: memberRole,
  });
  if (error) return { error: error.message };
  revalidatePath("/workspace");
  return {
    message: "Team member added. They can sign in and select this workspace.",
  };
}

export async function signOut() {
  const client = await createClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error("Could not sign out. Please retry.");
  (await cookies()).delete(TENANT_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
