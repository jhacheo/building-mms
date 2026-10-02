"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  login,
  signup,
  createTenant,
  addMember,
  signInWithGoogle,
} from "@/lib/auth/actions";

function Feedback({ state }: { state: { error?: string; message?: string } }) {
  return (
    <>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg bg-green-50 p-4 text-green-900" role="status">
          {state.message}
        </p>
      )}
    </>
  );
}

export function GoogleSignInForm() {
  const [state, action, pending] = useActionState(signInWithGoogle, {});
  return (
    <form action={action} className="record-form" aria-busy={pending}>
      <Feedback state={state} />
      <button
        className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900"
        disabled={pending}
      >
        {pending ? "Connecting…" : "Continue with Google"}
      </button>
    </form>
  );
}

export function AccountForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(
    mode === "login" ? login : signup,
    {},
  );
  return (
    <form action={action} className="record-form" aria-busy={pending}>
      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : 1}
          required
        />
      </label>
      {mode === "signup" && (
        <p className="form-help">
          Use at least 8 characters. Your email may need confirmation before you
          can sign in.
        </p>
      )}
      <Feedback state={state} />
      <button
        className="rounded-lg bg-[#176e57] px-5 py-3 font-semibold text-white"
        disabled={pending}
      >
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
      <p>
        {mode === "login" ? "New to Building MMS? " : "Already registered? "}
        <Link
          className="font-semibold text-[#176e57] underline"
          href={mode === "login" ? "/signup" : "/login"}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState(createTenant, {});
  return (
    <form action={action} className="record-form" aria-busy={pending}>
      <label className="field">
        <span>Workspace name</span>
        <input
          name="name"
          placeholder="Your organisation or building team"
          maxLength={120}
          required
        />
      </label>
      <label className="field">
        <span>Your name</span>
        <input
          name="member_name"
          autoComplete="name"
          maxLength={120}
          required
        />
      </label>
      <Feedback state={state} />
      <button
        className="rounded-lg bg-[#176e57] px-5 py-3 font-semibold text-white"
        disabled={pending}
      >
        {pending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, {});
  return (
    <form action={action} className="record-form" aria-busy={pending}>
      <p>
        Ask your colleague to sign in with Google first, or use an existing
        email-verified account. Add them here using that email. No invitation
        email is sent.
      </p>
      <label className="field">
        <span>Member email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      <label className="field">
        <span>Role</span>
        <select name="role" defaultValue="building_manager">
          <option value="building_manager">Building manager</option>
          <option value="inspection_manager">Inspection manager</option>
          <option value="technician">Technician</option>
          <option value="asset_manager">Asset manager</option>
          <option value="admin">Administrator</option>
        </select>
      </label>
      <Feedback state={state} />
      <button
        className="rounded-lg bg-[#176e57] px-5 py-3 font-semibold text-white"
        disabled={pending}
      >
        {pending ? "Adding…" : "Add team member"}
      </button>
    </form>
  );
}
