const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = "public-assets";

/**
 * Build public URL for a file in public-assets bucket.
 * Append ?v=timestamp for cache busting when needed.
 */
export function getPublicAssetUrl(path: string, cacheBust?: string): string {
  if (!SUPABASE_URL) return "";
  const base = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${path.replace(/^\//, "")}`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}
