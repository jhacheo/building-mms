import Link from "next/link";
import { requireTenant } from "@/lib/auth/tenant";
import { selectTenant, signOut } from "@/lib/auth/actions";
import {
  CreateWorkspaceForm,
  AddMemberForm,
} from "@/app/components/account-forms";

export default async function WorkspaceSettings() {
  const { tenant, user, role, tenants, members } = await requireTenant();
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-[#176e57]">
          ← Maintenance
        </Link>
        <form action={signOut}>
          <button className="text-[#176e57] underline">Sign out</button>
        </form>
      </header>
      <div>
        <h1>Workspace & team</h1>
        <p className="mt-3">
          {tenant.name} · {role.replaceAll("_", " ")} · {user.email}
        </p>
      </div>
      <section className="space-y-4 rounded-xl border border-[#e0e7e6] bg-white p-5">
        <h2>Your workspaces</h2>
        <form action={selectTenant} className="flex flex-wrap items-end gap-3">
          <label className="field grow">
            <span>Active workspace</span>
            <select name="tenant_id" defaultValue={tenant.id}>
              {tenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-lg bg-[#176e57] px-5 py-3 font-semibold text-white">
            Switch workspace
          </button>
        </form>
        <p>
          Properties, assets, work orders and audit history belong to the
          selected workspace.
        </p>
      </section>
      <section className="space-y-4 rounded-xl border border-[#e0e7e6] bg-white p-5">
        <h2>Team members</h2>
        <ul className="divide-y divide-[#e0e7e6]">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap justify-between gap-2 py-3"
            >
              <span>
                {member.display_name || "Team member"}
                {member.user_id === user.id ? " (you)" : ""}
              </span>
              <span className="text-[#6b7d83]">
                {member.role.replaceAll("_", " ")}
              </span>
            </li>
          ))}
        </ul>
        {role === "admin" && <AddMemberForm />}
      </section>
      <section className="space-y-4 rounded-xl border border-[#e0e7e6] bg-white p-5">
        <h2>Create another workspace</h2>
        <p>
          You will become its administrator. This creates an empty, separate
          workspace.
        </p>
        <CreateWorkspaceForm />
      </section>
    </main>
  );
}
