export const cors_headers: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-contest-session",
  "Content-Type": "application/json",
};

export function json_response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: cors_headers });
}

export function options_response(): Response {
  return new Response(null, { headers: cors_headers });
}
