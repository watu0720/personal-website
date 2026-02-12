import type { SupabaseClient } from "@supabase/supabase-js";

export type CommentRow = {
  id: string;
  page_key: string;
  author_type: "guest" | "user";
  author_user_id: string | null;
  guest_name: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  body: string;
  body_has_links: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  admin_heart: boolean;
  admin_heart_by: string | null;
  created_at: string;
  edited_at: string | null;
};

export type CommentWithCounts = CommentRow & {
  good_count: number;
  not_good_count: number;
  report_count?: number;
};

export type CommentReplyRow = {
  id: string;
  parent_comment_id: string;
  page_key: string;
  author_user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CommentReplyWithCounts = CommentReplyRow & {
  good_count: number;
};

const PAGE_KEYS = ["home", "profile", "youtube", "niconico", "dev"] as const;
export function isValidPageKey(key: string): key is (typeof PAGE_KEYS)[number] {
  return PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number]);
}

/** Check body contains only allowed links (http/https) and limit count. */
export function checkBodyLinks(
  body: string
): { ok: boolean; hasLinks: boolean; linkCount: number } {
  const urlRe = /https?:\/\/[^\s]+/gi;
  const matches = body.match(urlRe);
  if (!matches) return { ok: true, hasLinks: false, linkCount: 0 };
  const allOk = matches.every((u) => /^https?:\/\//i.test(u));
  const linkCount = matches.length;
  const withinLimit = linkCount <= 2;
  return { ok: allOk && withinLimit, hasLinks: true, linkCount };
}

/** Shorten URL for display (e.g. example.com/...) */
export function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    if (path.length > 20) return `${host}${path.slice(0, 17)}...`;
    return `${host}${path}`;
  } catch {
    return url.slice(0, 30);
  }
}

export async function getCommentsForPage(
  supabase: SupabaseClient,
  pageKey: string,
  options: { forAdmin?: boolean } = {}
): Promise<CommentRow[]> {
  let q = supabase
    .from("comments")
    .select("*")
    .eq("page_key", pageKey)
    .order("created_at", { ascending: false });
  if (!options.forAdmin) {
    q = q.eq("is_hidden", false);
  }
  const { data } = await q;
  return (data ?? []) as CommentRow[];
}

/** Latest comments across all pages (non-hidden). For home notifications. */
export async function getLatestComments(
  supabase: SupabaseClient,
  limit: number
): Promise<CommentRow[]> {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CommentRow[];
}

export async function getReactionCounts(
  supabase: SupabaseClient,
  commentIds: string[]
): Promise<Record<string, { good: number; not_good: number }>> {
  if (commentIds.length === 0) return {};
  const { data } = await supabase
    .from("comment_reactions")
    .select("comment_id, reaction_type")
    .in("comment_id", commentIds);
  const out: Record<string, { good: number; not_good: number }> = {};
  for (const id of commentIds) {
    out[id] = { good: 0, not_good: 0 };
  }
  for (const row of data ?? []) {
    const r = row as { comment_id: string; reaction_type: string };
    if (out[r.comment_id]) {
      if (r.reaction_type === "good") out[r.comment_id].good += 1;
      if (r.reaction_type === "not_good") out[r.comment_id].not_good += 1;
    }
  }
  return out;
}

export async function getRepliesForComments(
  supabase: SupabaseClient,
  parentIds: string[]
): Promise<Record<string, CommentReplyRow[]>> {
  if (parentIds.length === 0) return {};
  const { data } = await supabase
    .from("comment_replies")
    .select("*")
    .in("parent_comment_id", parentIds)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as CommentReplyRow[];
  const map: Record<string, CommentReplyRow[]> = {};
  for (const id of parentIds) {
    map[id] = [];
  }
  for (const row of rows) {
    if (!map[row.parent_comment_id]) map[row.parent_comment_id] = [];
    map[row.parent_comment_id].push(row);
  }
  return map;
}

export async function getReportCounts(
  supabase: SupabaseClient,
  commentIds: string[]
): Promise<Record<string, number>> {
  if (commentIds.length === 0) return {};
  const { data } = await supabase
    .from("comment_reports")
    .select("comment_id")
    .in("comment_id", commentIds);
  const out: Record<string, number> = {};
  for (const id of commentIds) out[id] = 0;
  for (const row of data ?? []) {
    const r = row as { comment_id: string };
    if (out[r.comment_id] !== undefined) out[r.comment_id] += 1;
  }
  return out;
}

/** Get reply counts for parent comments. */
export async function getReplyCounts(
  supabase: SupabaseClient,
  parentIds: string[]
): Promise<Record<string, number>> {
  if (parentIds.length === 0) return {};
  const { data } = await supabase
    .from("comment_replies")
    .select("parent_comment_id")
    .in("parent_comment_id", parentIds)
    .is("deleted_at", null);
  const out: Record<string, number> = {};
  for (const id of parentIds) out[id] = 0;
  for (const row of data ?? []) {
    const r = row as { parent_comment_id: string };
    if (out[r.parent_comment_id] !== undefined) {
      out[r.parent_comment_id] += 1;
    }
  }
  return out;
}
