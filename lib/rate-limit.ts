/**
 * In-memory rate limit (simple). For production consider Redis/Upstash.
 * Key: string (e.g. "comment:ip" or "report:fingerprint")
 * Limit: N actions per windowMs.
 */
const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute

function getKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

export function checkRateLimit(
  prefix: string,
  id: string,
  limit: number
): { ok: boolean; remaining: number } {
  const key = getKey(prefix, id);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

export function getClientId(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip || "unknown";
}
