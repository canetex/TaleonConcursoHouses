import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json_response, options_response } from "../_shared/cors.ts";
import { discord_id_from_request } from "../_shared/session.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";
import { assert_voting_open } from "../_shared/phases.ts";
import { check_rate_limit } from "../_shared/rate-limit.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();
  if (!check_rate_limit(req, "cast-vote")) {
    return json_response({ error: "Rate limit excedido" }, 429);
  }

  try {
    const body = await req.json();
    const discord_id = await discord_id_from_request(req, body);
    if (!discord_id) return json_response({ error: "Sessão inválida ou expirada" }, 401);

    const house_id = typeof body.house_id === "string" ? body.house_id : "";
    const vote_type = body.vote_type === "dislike" ? "dislike" : body.vote_type === "match" ? "match" : null;

    if (!house_id || !vote_type) {
      return json_response({ error: "house_id e vote_type são obrigatórios" }, 400);
    }

    const supabase = create_admin_client();
    await assert_voting_open(supabase);

    const { data: contest_user, error: user_error } = await supabase
      .from("contest_users")
      .select("validated_character")
      .eq("discord_id", discord_id)
      .maybeSingle();

    if (user_error) {
      return json_response({ error: user_error.message }, 400);
    }

    const voter_character = typeof contest_user?.validated_character === "string"
      ? contest_user.validated_character.trim()
      : "";

    if (!voter_character) {
      return json_response(
        { error: "Valide o seu personagem no portal antes de votar" },
        403,
      );
    }

    const { data: house, error: house_error } = await supabase
      .from("houses")
      .select("id, status")
      .eq("id", house_id)
      .maybeSingle();

    if (house_error || !house) {
      return json_response({ error: "Casa não encontrada" }, 404);
    }
    if (house.status !== "approved") {
      return json_response({ error: "Só é possível votar em casas aprovadas" }, 400);
    }

    const { data, error } = await supabase
      .from("house_votes")
      .upsert(
        {
          discord_user_id: discord_id,
          voter_character,
          house_id,
          vote_type,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "discord_user_id,house_id" },
      )
      .select()
      .single();

    if (error) return json_response({ error: error.message }, 400);
    return json_response({ vote: data });
  } catch (error) {
    return json_response({ error: String(error) }, 400);
  }
});
