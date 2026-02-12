import type { SupabaseClient } from "@supabase/supabase-js";

export type ExternalCacheRow = {
  id: string;
  provider: string;
  cache_key: string;
  payload_json: unknown;
  fetched_at: string;
  ttl_seconds: number;
  created_at: string;
  updated_at: string;
};

export async function getCached<T>(
  supabase: SupabaseClient,
  provider: string,
  cacheKey: string
): Promise<T | null> {
  const { data } = await supabase
    .from("external_cache")
    .select("payload_json, fetched_at, ttl_seconds")
    .eq("provider", provider)
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (!data) return null;

  const row = data as {
    payload_json: unknown;
    fetched_at: string;
    ttl_seconds: number;
  };

  const ageSeconds = (Date.now() - new Date(row.fetched_at).getTime()) / 1000;
  if (ageSeconds > row.ttl_seconds) {
    // 期限切れ
    return null;
  }

  return row.payload_json as T;
}

export async function setCached(
  supabase: SupabaseClient,
  provider: string,
  cacheKey: string,
  payload: unknown,
  ttlSeconds = 3600
): Promise<void> {
  await supabase.from("external_cache").upsert(
    {
      provider,
      cache_key: cacheKey,
      payload_json: payload as Record<string, unknown>,
      fetched_at: new Date().toISOString(),
      ttl_seconds: ttlSeconds,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "provider,cache_key",
    }
  );
}
