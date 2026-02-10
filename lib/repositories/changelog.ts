import type { SupabaseClient } from "@supabase/supabase-js";

export type ChangelogRow = {
  id: string;
  title: string;
  body_html: string;
  published_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getChangelog(
  supabase: SupabaseClient,
  options: { limit?: number } = {}
): Promise<ChangelogRow[]> {
  let q = supabase
    .from("changelog")
    .select("id, title, body_html, published_at, created_by, created_at, updated_at")
    .order("published_at", { ascending: false });
  if (options.limit != null) q = q.limit(options.limit);
  const { data } = await q;
  return (data ?? []) as ChangelogRow[];
}
