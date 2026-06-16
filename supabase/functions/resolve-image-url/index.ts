import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const DIRECT_IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i;

function clean_image_url(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function extract_meta_image(html: string): string | null {
  const patterns = [
    /property="og:image"[^>]*content="([^"]+)"/i,
    /content="([^"]+)"[^>]*property="og:image"/i,
    /name="twitter:image"[^>]*content="([^"]+)"/i,
    /content="([^"]+)"[^>]*name="twitter:image"/i,
    /https:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(?:png|jpe?g|gif|webp)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return clean_image_url(match[1]);
    if (match?.[0] && match[0].startsWith("http")) return clean_image_url(match[0]);
  }

  return null;
}

function try_imgur_direct(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "i.imgur.com" && DIRECT_IMAGE_PATTERN.test(parsed.pathname)) {
      return clean_image_url(url);
    }

    if (host === "imgur.com") {
      const single = parsed.pathname.match(/^\/([a-zA-Z0-9]+)$/);
      if (single) return `https://i.imgur.com/${single[1]}.png`;
    }
  } catch {
    return null;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors_headers });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ resolved_url: null, error: "url is required" }),
        { status: 400, headers: cors_headers },
      );
    }

    const trimmed = url.trim();
    const direct = try_imgur_direct(trimmed);

    if (direct) {
      return new Response(
        JSON.stringify({ resolved_url: direct, source: "direct" }),
        { headers: cors_headers },
      );
    }

    const response = await fetch(trimmed, {
      headers: { "User-Agent": "TaleonConcursoHouses/1.0" },
      redirect: "follow",
    });

    const html = await response.text();
    const resolved = extract_meta_image(html);

    if (!resolved) {
      return new Response(
        JSON.stringify({
          resolved_url: null,
          error: "Não foi possível extrair imagem desta URL. Use o link direto da imagem.",
        }),
        { status: 400, headers: cors_headers },
      );
    }

    return new Response(
      JSON.stringify({ resolved_url: resolved, source: "fetched" }),
      { headers: cors_headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ resolved_url: null, error: String(error) }),
      { status: 500, headers: cors_headers },
    );
  }
});
