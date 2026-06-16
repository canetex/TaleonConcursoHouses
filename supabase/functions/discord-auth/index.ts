import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";
const DEFAULT_CLIENT_ID = "1516151956291190884";

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

async function get_discord_credentials(supabase: ReturnType<typeof createClient>) {
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors_headers });
  }

  try {
    const { code, redirect_uri, code_verifier } = await req.json();

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "code e redirect_uri são obrigatórios" }),
        { status: 400, headers: cors_headers },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
      return new Response(
        JSON.stringify({
          error: "Discord OAuth requer PKCE (code_verifier) ou Client Secret configurado",
        }),
        { status: 500, headers: cors_headers },
      );
    }

    const token_response = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: token_params,
    });

    const token_data = await token_response.json();

    if (!token_response.ok) {
      return new Response(
        JSON.stringify({ error: "Falha ao trocar código Discord", details: token_data }),
        { status: 400, headers: cors_headers },
      );
    }

    const user_response = await fetch(DISCORD_USER_URL, {
      headers: { Authorization: `Bearer ${token_data.access_token}` },
    });

    const discord_user = await user_response.json();

    if (!user_response.ok) {
      return new Response(
        JSON.stringify({ error: "Falha ao obter perfil Discord", details: discord_user }),
        { status: 400, headers: cors_headers },
      );
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

    return new Response(
      JSON.stringify({
        discord_id,
        discord_username,
        discord_avatar,
      }),
      { headers: cors_headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: cors_headers },
    );
  }
});
