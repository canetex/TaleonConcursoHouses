import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CHARACTER_PROFILE_URL = "https://san.taleon.online/characterprofile.php";

// Campos presentes apenas no perfil de um personagem existente.
// A pagina de personagem inexistente cai no layout generico do site e nao contem nenhum destes.
const CHARACTER_DATA_MARKERS = [
  "vocation",
  "experience",
  "residence",
  "sex:",
  "account status",
];

// Numero minimo de marcadores de dados necessarios para considerar o personagem valido.
const MIN_DATA_MARKERS = 3;

// Mensagens explicitas de personagem inexistente (defesa adicional caso o site mude o layout).
const NOT_FOUND_MARKERS = [
  "character does not exist",
  "does not exist",
  "could not be found",
  "character not found",
];

const json_headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

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
        { status: 400, headers: json_headers },
      );
    }

    const trimmed = character_name.trim();
    if (trimmed.length < 2 || trimmed.length > 64) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: json_headers },
      );
    }

    const url = `${CHARACTER_PROFILE_URL}?name=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TaleonConcursoHouses/1.0" },
    });

    const html = await response.text();
    const lower_html = html.toLowerCase();

    const explicitly_not_found = NOT_FOUND_MARKERS.some((marker) =>
      lower_html.includes(marker)
    );

    // O(n) sobre o numero de marcadores (constante pequena).
    const data_marker_hits = CHARACTER_DATA_MARKERS.reduce(
      (count, marker) => (lower_html.includes(marker) ? count + 1 : count),
      0,
    );

    const valid =
      response.ok &&
      !explicitly_not_found &&
      data_marker_hits >= MIN_DATA_MARKERS;

    return new Response(
      JSON.stringify({ valid, character_name: trimmed }),
      { headers: json_headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: String(error) }),
      { status: 500, headers: json_headers },
    );
  }
});
