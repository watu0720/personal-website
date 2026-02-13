import type { SupabaseClient } from "@supabase/supabase-js";

export type NewsPost = {
  id: string;
  title: string;
  body_html: string;
  thumbnail_url: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NewsPostWithNew = NewsPost & {
  is_new: boolean;
};

export async function getNewsPosts(
  supabase: SupabaseClient,
  options: {
    status?: "draft" | "published";
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
    forAdmin?: boolean;
  } = {}
): Promise<{ posts: NewsPost[]; total: number }> {
  const {
    status = "published",
    tags,
    search,
    limit = 20,
    offset = 0,
    forAdmin = false,
  } = options;

  let q = supabase
    .from("news_posts")
    .select("*", { count: "exact" });

  if (!forAdmin) {
    q = q.eq("status", "published").is("deleted_at", null);
  } else if (status) {
    q = q.eq("status", status);
  }

  if (tags && tags.length > 0) {
    q = q.contains("tags", tags);
  }

  if (search) {
    q = q.or(`title.ilike.%${search}%,body_html.ilike.%${search}%`);
  }

  q = q.order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await q;

  if (error) {
    console.error("Error fetching news posts:", error);
    return { posts: [], total: 0 };
  }

  return {
    posts: (data ?? []) as NewsPost[],
    total: count ?? 0,
  };
}

export async function getNewsPostById(
  supabase: SupabaseClient,
  id: string,
  options: { forAdmin?: boolean } = {}
): Promise<NewsPost | null> {
  const { forAdmin = false } = options;

  let q = supabase
    .from("news_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!forAdmin) {
    q = q.eq("status", "published").is("deleted_at", null);
  }

  const { data, error } = await q;

  if (error || !data) return null;

  return data as NewsPost;
}

export async function getLatestNewsPosts(
  supabase: SupabaseClient,
  limit: number = 5
): Promise<NewsPostWithNew[]> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as NewsPost[]).map((post) => ({
    ...post,
    is_new: new Date(post.updated_at) >= twoWeeksAgo,
  }));
}

export async function getAllTags(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("tags")
    .eq("status", "published")
    .is("deleted_at", null);

  if (error || !data) return [];

  const tagSet = new Set<string>();
  for (const row of data) {
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        if (typeof tag === "string" && tag.trim()) {
          tagSet.add(tag.trim());
        }
      }
    }
  }

  return Array.from(tagSet).sort();
}
