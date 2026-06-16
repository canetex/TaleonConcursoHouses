import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json_response, options_response } from "../_shared/cors.ts";
import { discord_id_from_request } from "../_shared/session.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();

  try {
    const body = await req.json();
    const discord_id = await discord_id_from_request(req, body);
    if (!discord_id) return json_response({ error: "Sessão inválida ou expirada" }, 401);

    const supabase = create_admin_client();
    const { data, error } = await supabase
      .from("house_votes")
      .select("house_id, vote_type")
      .eq("discord_user_id", discord_id);

    if (error) return json_response({ error: error.message }, 400);
    return json_response({ votes: data ?? [] });
  } catch (error) {
    return json_response({ error: String(error) }, 500);
  }
});
