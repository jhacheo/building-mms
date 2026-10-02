import { createClient } from "@supabase/supabase-js";
export function db(actor = "Demo manager") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Database configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { "x-actor-name": actor.replace(/[^\x20-\x7e]/g, "?") },
    },
  });
}
export function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "23503")
    throw new Error(
      "Remove linked work orders and assets first. An asset must belong to the selected property.",
    );
  throw new Error(error.message);
}
