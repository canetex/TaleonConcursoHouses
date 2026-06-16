import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json_response, options_response } from "../_shared/cors.ts";
import { discord_id_from_request } from "../_shared/session.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";
import { load_admin_ids } from "../_shared/phases.ts";
import { clamp_house_counts } from "../_shared/validation.ts";
import { check_rate_limit } from "../_shared/rate-limit.ts";

const ALLOWED_FIELDS = new Set([
  "status",
  "organizer_votes",
  "honorable_mention",
  "dummies_count",
  "hirelings_count",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();
  if (!check_rate_limit(req, "admin-update-house")) {
    return json_response({ error: "Rate limit excedido" }, 429);
  }

  try {
    const body = await req.json();
    const discord_id = await discord_id_from_request(req, body);
    if (!discord_id) return json_response({ error: "Sessão inválida ou expirada" }, 401);

    const house_id = typeof body.house_id === "string" ? body.house_id : "";
    const updates = body.updates as Record<string, unknown> | undefined;

    if (!house_id || !updates || typeof updates !== "object") {
      return json_response({ error: "house_id e updates são obrigatórios" }, 400);
    }

    const supabase = create_admin_client();
    const admin_ids = await load_admin_ids(supabase);
    if (!admin_ids.includes(discord_id)) {
      return json_response({ error: "Acesso negado ao painel admin" }, 403);
    }

    const safe_updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_FIELDS.has(key)) continue;
      safe_updates[key] = value;
    }

    if ("dummies_count" in safe_updates || "hirelings_count" in safe_updates) {
      const { data: house } = await supabase
        .from("houses")
        .select("dummies_count, hirelings_count")
        .eq("id", house_id)
        .maybeSingle();
      clamp_house_counts(
        Number(safe_updates.dummies_count ?? house?.dummies_count ?? 0),
        Number(safe_updates.hirelings_count ?? house?.hirelings_count ?? 0),
      );
    }

    const { data, error } = await supabase
      .from("houses")
      .update(safe_updates)
      .eq("id", house_id)
      .select()
      .single();

    if (error) return json_response({ error: error.message }, 400);
    return json_response({ house: data });
  } catch (error) {
    return json_response({ error: String(error) }, 400);
  }
});
