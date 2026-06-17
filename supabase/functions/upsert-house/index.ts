import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json_response, options_response } from "../_shared/cors.ts";
import { discord_id_from_request } from "../_shared/session.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";
import { assert_registration_open } from "../_shared/phases.ts";
import { clamp_house_counts, validate_screenshot_urls } from "../_shared/validation.ts";
import { check_rate_limit } from "../_shared/rate-limit.ts";
import { should_reset_approved_to_pending } from "../_shared/house-guards.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();
  if (!check_rate_limit(req, "upsert-house")) {
    return json_response({ error: "Rate limit excedido" }, 429);
  }

  try {
    const body = await req.json();
    const discord_id = await discord_id_from_request(req, body);
    if (!discord_id) return json_response({ error: "Sessão inválida ou expirada" }, 401);

    const supabase = create_admin_client();
    await assert_registration_open(supabase);

    const screenshot_urls = validate_screenshot_urls(body.screenshot_urls);
    clamp_house_counts(Number(body.dummies_count ?? 0), Number(body.hirelings_count ?? 0));

    const required_fields = [
      "character_name",
      "location",
      "floor",
      "custom_name",
      "theme",
      "house_city",
      "house_tibia_name",
      "house_wiki_slug",
      "house_wiki_url",
      "house_type",
    ] as const;

    for (const field of required_fields) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return json_response({ error: `Campo obrigatório: ${field}` }, 400);
      }
    }

    const payload = {
      character_name: body.character_name.trim(),
      location: body.location.trim(),
      floor: body.floor.trim(),
      custom_name: body.custom_name.trim(),
      theme: body.theme.trim(),
      dummies_count: Number(body.dummies_count ?? 0),
      hirelings_count: Number(body.hirelings_count ?? 0),
      screenshot_urls,
      house_city: body.house_city.trim(),
      house_tibia_name: body.house_tibia_name.trim(),
      house_wiki_slug: body.house_wiki_slug.trim(),
      house_wiki_url: body.house_wiki_url.trim(),
      house_type: body.house_type,
      map_x: body.map_x ?? null,
      map_y: body.map_y ?? null,
      map_z: body.map_z ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("houses")
      .select(
        "id, status, discord_user_id, character_name, house_tibia_name, house_city, house_wiki_slug, screenshot_urls",
      )
      .eq("discord_user_id", discord_id)
      .maybeSingle();

    if (existing) {
      const reset_to_pending = should_reset_approved_to_pending(existing.status, existing, payload);
      const update_payload = {
        ...payload,
        ...(existing.status === "rejected" || reset_to_pending ? { status: "pending" as const } : {}),
      };

      const { data, error } = await supabase
        .from("houses")
        .update(update_payload)
        .eq("id", existing.id)
        .eq("discord_user_id", discord_id)
        .select()
        .single();

      if (error) return json_response({ error: error.message, code: error.code }, 400);
      return json_response({ house: data, action: "updated" });
    }

    const { data, error } = await supabase
      .from("houses")
      .insert({
        discord_user_id: discord_id,
        ...payload,
        status: "pending",
      })
      .select()
      .single();

    if (error) return json_response({ error: error.message, code: error.code }, 400);
    return json_response({ house: data, action: "created" });
  } catch (error) {
    return json_response({ error: String(error) }, 400);
  }
});
