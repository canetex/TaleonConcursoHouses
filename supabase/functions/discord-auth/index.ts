import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { cors_headers, json_response, options_response } from "../_shared/cors.ts";
import { create_session_token } from "../_shared/session.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";
import { check_rate_limit } from "../_shared/rate-limit.ts";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";
const DEFAULT_CLIENT_ID = "1516151956291190884";

async function get_discord_credentials(supabase: ReturnType<typeof create_admin_client>) {
  const { data } = await supabase.from("contest_config").select("key, value").in("key", [
    "discord_client_id",
    "discord_client_secret",
  ]);
  const config = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  return {
    client_id: Deno.env.get("DISCORD_CLIENT_ID") ?? config.discord_client_id ?? DEFAULT_CLIENT_ID,
    client_secret: Deno.env.get("DISCORD_CLIENT_SECRET") ?? config.discord_client_secret ?? "",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();
  if (!check_rate_limit(req, "discord-auth")) {
    return json_response({ error: "Rate limit excedido" }, 429);
  }

  try {
    const { code, redirect_uri, code_verifier } = await req.json();

    if (!code || !redirect_uri) {
      return json_response({ error: "code e redirect_uri são obrigatórios" }, 400);
    }

    const supabase = create_admin_client();
    const { client_id, client_secret } = await get_discord_credentials(supabase);

    const token_params = new URLSearchParams({
      client_id,
      grant_type: "authorization_code",
      code,
      redirect_uri,
    });

    if (typeof code_verifier === "string" && code_verifier.length > 0) {
      token_params.set("code_verifier", code_verifier);
    } else if (client_secret) {
      token_params.set("client_secret", client_secret);
    } else {
      return json_response({
        error: "Discord OAuth requer PKCE (code_verifier) ou Client Secret configurado",
      }, 500);
    }

    const token_response = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: token_params,
    });
    const token_data = await token_response.json();

    if (!token_response.ok) {
      return json_response({ error: "Falha ao trocar código Discord", details: token_data }, 400);
    }

    const user_response = await fetch(DISCORD_USER_URL, {
      headers: { Authorization: `Bearer ${token_data.access_token}` },
    });
    const discord_user = await user_response.json();

    if (!user_response.ok) {
      return json_response({ error: "Falha ao obter perfil Discord", details: discord_user }, 400);
    }

    const discord_id = discord_user.id as string;
    const discord_username = discord_user.global_name ?? discord_user.username ?? null;
    const avatar_hash = discord_user.avatar as string | null;
    const discord_avatar = avatar_hash
      ? `https://cdn.discordapp.com/avatars/${discord_id}/${avatar_hash}.png`
      : null;

    await supabase.from("contest_users").upsert(
      {
        discord_id,
        discord_username,
        discord_avatar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "discord_id" },
    );

    const session_token = await create_session_token(discord_id);

    return new Response(
      JSON.stringify({ discord_id, discord_username, discord_avatar, session_token }),
      { headers: cors_headers },
    );
  } catch (error) {
    return json_response({ error: String(error) }, 500);
  }
});
