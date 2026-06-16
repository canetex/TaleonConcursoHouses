import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json_response, options_response } from "../_shared/cors.ts";
import { create_admin_client } from "../_shared/supabase-admin.ts";
import { get_current_phase, load_admin_ids, load_contest_dates } from "../_shared/phases.ts";
import { check_rate_limit } from "../_shared/rate-limit.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return options_response();
  if (!check_rate_limit(req, "get-contest-phase")) {
    return json_response({ error: "Rate limit excedido" }, 429);
  }

  try {
    const supabase = create_admin_client();
    const dates = await load_contest_dates(supabase);
    if (!dates) {
      return json_response({ error: "Configuração do concurso indisponível" }, 500);
    }

    const admin_ids = await load_admin_ids(supabase);
    const phase = get_current_phase(dates);

    return json_response({ phase, dates, admin_ids });
  } catch (error) {
    return json_response({ error: String(error) }, 500);
  }
});
