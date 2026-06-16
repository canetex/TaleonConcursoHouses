const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function base64_url_encode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64_url_decode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function import_hmac_key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function create_session_token(discord_id: string): Promise<string> {
  const secret = Deno.env.get("CONTEST_SESSION_SECRET");
  if (!secret) throw new Error("CONTEST_SESSION_SECRET não configurado");

  const exp = Date.now() + SESSION_TTL_MS;
  const payload = base64_url_encode(new TextEncoder().encode(JSON.stringify({ discord_id, exp })));
  const key = await import_hmac_key(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${base64_url_encode(new Uint8Array(signature))}`;
}

export async function verify_session_token(token: string): Promise<string | null> {
  const secret = Deno.env.get("CONTEST_SESSION_SECRET");
  if (!secret || !token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  try {
    const key = await import_hmac_key(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64_url_decode(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    const parsed = JSON.parse(new TextDecoder().decode(base64_url_decode(payload))) as {
      discord_id?: string;
      exp?: number;
    };
    if (!parsed.discord_id || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    return parsed.discord_id;
  } catch {
    return null;
  }
}

export async function discord_id_from_request(req: Request, body?: Record<string, unknown>): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const header_token = req.headers.get("x-contest-session");
  const body_token = typeof body?.session_token === "string" ? body.session_token : null;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : header_token ?? body_token;
  if (!token) return null;
  return verify_session_token(token);
}
