import { AccountForm } from "@/app/components/account-forms";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Signup() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user && !user.is_anonymous) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="font-semibold text-[#176e57]">BUILDING MMS</p>
        <h1 className="mt-3">Create your account</h1>
        <p className="mt-3">
          Manage maintenance with your team. Each workspace keeps its records
          private.
        </p>
      </div>
      <AccountForm mode="signup" />
    </main>
  );
}
