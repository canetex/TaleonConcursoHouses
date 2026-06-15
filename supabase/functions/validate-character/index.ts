import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CHARACTER_PROFILE_URL = "https://san.taleon.online/characterprofile.php";

const INVALID_MARKERS = [
  "Character does not exist",
  "character does not exist",
  "does not exist",
  "error",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { character_name } = await req.json();

    if (!character_name || typeof character_name !== "string") {
      return new Response(
        JSON.stringify({ valid: false, error: "character_name is required" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const trimmed = character_name.trim();
    if (trimmed.length < 2 || trimmed.length > 64) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const url = `${CHARACTER_PROFILE_URL}?name=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TaleonConcursoHouses/1.0" },
    });

    const html = await response.text();
    const lower_html = html.toLowerCase();
    const is_invalid = INVALID_MARKERS.some((marker) =>
      lower_html.includes(marker.toLowerCase())
    ) || html.length < 500;

    const has_character_data =
      lower_html.includes("level") ||
      lower_html.includes("vocation") ||
      lower_html.includes("experience");

    const valid = !is_invalid && has_character_data;

    return new Response(
      JSON.stringify({ valid, character_name: trimmed }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }
});
