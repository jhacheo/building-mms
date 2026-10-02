import { AccountForm, GoogleSignInForm } from "@/app/components/account-forms";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="font-semibold text-[#176e57]">BUILDING MMS</p>
        <h1 className="mt-3">Welcome back</h1>
        <p className="mt-3">Sign in to your private maintenance workspace.</p>
      </div>
      {params.error && (
        <p className="form-error" role="alert">
          Could not complete sign-in. Please try again. If you cancelled Google
          sign-in, choose Continue with Google to restart.
        </p>
      )}
      <GoogleSignInForm />
      <p className="text-center text-sm text-gray-600">
        Or sign in with an existing password account
      </p>
      <AccountForm mode="login" />
    </main>
  );
}
