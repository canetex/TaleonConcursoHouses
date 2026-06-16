import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json_response, options_response } from "../_shared/cors.ts";
import { discord_id_from_request } from "../_shared/session.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";
import { check_rate_limit } from "../_shared/rate-limit.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();
  if (!check_rate_limit(req, "update-profile")) {
    return json_response({ error: "Rate limit excedido" }, 429);
  }

  try {
    const body = await req.json();
    const discord_id = await discord_id_from_request(req, body);
    if (!discord_id) return json_response({ error: "Sessão inválida ou expirada" }, 401);

    const supabase = create_admin_client();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.discord_username === "string") updates.discord_username = body.discord_username;
    if (typeof body.discord_avatar === "string" || body.discord_avatar === null) {
      updates.discord_avatar = body.discord_avatar;
    }
    if (typeof body.validated_character === "string" || body.validated_character === null) {
      updates.validated_character = body.validated_character;
    }

    const { data, error } = await supabase
      .from("contest_users")
      .upsert({ discord_id, ...updates }, { onConflict: "discord_id" })
      .select()
      .single();

    if (error) return json_response({ error: error.message }, 400);
    return json_response({ profile: data });
  } catch (error) {
    return json_response({ error: String(error) }, 500);
  }
});
