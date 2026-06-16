import { createClient } from "jsr:@supabase/supabase-js@2";

export function create_admin_client() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin credentials missing");
  return createClient(url, key);
}
