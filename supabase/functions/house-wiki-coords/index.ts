import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const WIKI_BASE = "https://www.tibiawiki.com.br/wiki/";

function parse_coords(raw: string): { x: number; y: number; z: number } | null {
  const match = raw.match(/^(\d+),(\d+),(\d+):/);
  if (!match) return null;
  return {
    x: Number(match[1]),
    y: Number(match[2]),
    z: Number(match[3]),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors_headers });
  }

  try {
    const { wiki_slug } = await req.json();

    if (!wiki_slug || typeof wiki_slug !== "string") {
      return new Response(
        JSON.stringify({ error: "wiki_slug é obrigatório" }),
        { status: 400, headers: cors_headers },
      );
    }

    const safe_slug = wiki_slug.replace(/[^a-zA-Z0-9_().,%'-]/g, "");
    const wiki_url = `${WIKI_BASE}${encodeURIComponent(safe_slug)}`;

    const response = await fetch(wiki_url, {
      headers: {
        "User-Agent": "TaleonConcursoHouses/1.0 (house location lookup)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Página da wiki não encontrada", wiki_url }),
        { status: 404, headers: cors_headers },
      );
    }

    const html = await response.text();
    const coord_matches = [...html.matchAll(/map_frame_coord"[^>]*>(\d+,\d+,\d+:\d+)/g)];

    let coords = null;
    for (const match of coord_matches) {
      const parsed = parse_coords(match[1]);
      if (parsed) {
        coords = parsed;
        break;
      }
    }

    return new Response(
      JSON.stringify({ wiki_url, coords }),
      { headers: cors_headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: cors_headers },
    );
  }
});
