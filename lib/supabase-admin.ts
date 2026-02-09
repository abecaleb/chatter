import { createClient } from "@supabase/supabase-js";

let adminClient: any = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  adminClient = createClient(url, key, {
    auth: { persistSession: false }
  });

  return adminClient;
}
