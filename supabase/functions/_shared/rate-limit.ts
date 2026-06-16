const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const buckets = new Map<string, { count: number; reset_at: number }>();

export function check_rate_limit(req: Request, bucket_key: string): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${bucket_key}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now > current.reset_at) {
    buckets.set(key, { count: 1, reset_at: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}
