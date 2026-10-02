import { AccountForm } from "@/app/components/account-forms";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user && !user.is_anonymous) redirect("/");
  const params = await searchParams;
  return (
    <main className="account-page mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="font-semibold text-[#1d4ed8]">BUILDING MMS</p>
        <h1 className="mt-3">Welcome back</h1>
        <p className="mt-3">Sign in to your private maintenance workspace.</p>
      </div>
      {params.error && (
        <p className="form-error" role="alert">
          Could not confirm your email. Try the latest confirmation link or sign
          in again.
        </p>
      )}
      <AccountForm mode="login" />
    </main>
  );
}
