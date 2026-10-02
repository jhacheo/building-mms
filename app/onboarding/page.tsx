import { CreateWorkspaceForm } from "@/app/components/account-forms";
import { getAuthContext } from "@/lib/auth/tenant";
import { signOut } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export default async function Onboarding() {
  const { user, tenants } = await getAuthContext();
  if (tenants.length) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="font-semibold text-[#176e57]">BUILDING MMS</p>
        <h1 className="mt-3">Your first workspace</h1>
        <p className="mt-3">
          Signed in as {user.email}. Create a private workspace for your team,
          or ask your administrator to add this email to theirs.
        </p>
      </div>
      <CreateWorkspaceForm />
      <form action={signOut}>
        <button className="text-[#176e57] underline">Sign out</button>
      </form>
    </main>
  );
}
