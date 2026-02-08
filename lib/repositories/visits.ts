import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_PAGE_KEYS = ["home", "profile", "youtube", "niconico", "dev"] as const;

export function isValidVisitPageKey(key: string): key is (typeof VALID_PAGE_KEYS)[number] {
  return VALID_PAGE_KEYS.includes(key as (typeof VALID_PAGE_KEYS)[number]);
}

/** Server only. Hash visitor id for storage (no raw cookie value in DB). */
export function hashVisitorId(visitorId: string): string {
  return createHash("sha256").update(visitorId, "utf8").digest("hex");
}

export async function recordVisit(
  supabase: SupabaseClient,
  pageKey: string,
  visitorHash: string
): Promise<void> {
  await supabase.from("page_visits").insert({
    page_key: pageKey,
    visitor_hash: visitorHash,
    visited_at: new Date().toISOString(),
  });
}

export type VisitStats = {
  pv: number;
  unique: number;
};

export async function getVisitStats(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<VisitStats> {
  const { data } = await supabase
    .from("page_visits")
    .select("id, visitor_hash")
    .gte("visited_at", `${fromDate}T00:00:00.000Z`)
    .lte("visited_at", `${toDate}T23:59:59.999Z`);
  const rows = (data ?? []) as { id: string; visitor_hash: string }[];
  const uniqueSet = new Set(rows.map((r) => r.visitor_hash));
  return { pv: rows.length, unique: uniqueSet.size };
}

export type PageRankItem = {
  page_key: string;
  pv: number;
  unique: number;
};

export async function getPageRanking(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<PageRankItem[]> {
  const { data } = await supabase
    .from("page_visits")
    .select("page_key, visitor_hash")
    .gte("visited_at", `${fromDate}T00:00:00.000Z`)
    .lte("visited_at", `${toDate}T23:59:59.999Z`);
  const rows = (data ?? []) as { page_key: string; visitor_hash: string }[];
  const byPage: Record<string, { pv: number; visitors: Set<string> }> = {};
  for (const r of rows) {
    if (!byPage[r.page_key]) {
      byPage[r.page_key] = { pv: 0, visitors: new Set() };
    }
    byPage[r.page_key].pv += 1;
    byPage[r.page_key].visitors.add(r.visitor_hash);
  }
  return Object.entries(byPage)
    .map(([page_key, { pv, visitors }]) => ({ page_key, pv, unique: visitors.size }))
    .sort((a, b) => b.pv - a.pv);
}
