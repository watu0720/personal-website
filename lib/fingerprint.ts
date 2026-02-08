const COOKIE_NAME = "guest_fp";
const COOKIE_DAYS = 7;

export function getOrCreateFingerprint(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) return match[1];
  const fp = `fp_${Math.random().toString(36).slice(2, 15)}${Date.now().toString(36)}`;
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${fp}; path=/; max-age=${COOKIE_DAYS * 24 * 60 * 60}; samesite=lax`;
  return fp;
}
