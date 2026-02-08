/**
 * Server only. Aggregates YouTube, Niconico, and comment notifications for Home.
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getLatestComments } from "@/lib/repositories/comments";
import { getYouTubeNotifications } from "@/lib/services/youtube";
import { getNiconicoNotifications } from "@/lib/services/niconico";

export type NotificationItem = {
  source: "youtube" | "niconico" | "comment";
  title: string;
  date: string;
  href: string;
  isExternal: boolean;
  meta?: string;
};

const PAGE_LABELS: Record<string, string> = {
  home: "ホーム",
  profile: "プロフィール",
  youtube: "YouTube",
  niconico: "ニコニコ",
  dev: "個人開発",
};

function excerpt(body: string, maxLen: number): string {
  const t = body.replace(/\s+/g, " ").trim();
  return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`;
}

export async function getHomeNotifications(limit = 6): Promise<NotificationItem[]> {
  const [yt, nico, commentsRows] = await Promise.all([
    getYouTubeNotifications().catch(() => ({ posts: [], playlistUpdates: [] })),
    getNiconicoNotifications().catch(() => ({ posts: [], mylistUpdates: [] })),
    (async () => {
      try {
        const admin = createServiceRoleClient();
        return await getLatestComments(admin, 10);
      } catch {
        return [];
      }
    })(),
  ]);

  const items: NotificationItem[] = [];

  for (const v of yt.posts) {
    items.push({
      source: "youtube",
      title: v.title,
      date: v.publishedAt,
      href: v.url,
      isExternal: true,
      meta: "投稿",
    });
  }
  for (const u of yt.playlistUpdates) {
    items.push({
      source: "youtube",
      title: u.video.title,
      date: u.addedAt,
      href: u.video.url,
      isExternal: true,
      meta: u.playlistTitle,
    });
  }
  for (const v of nico.posts) {
    items.push({
      source: "niconico",
      title: v.title,
      date: v.publishedAt,
      href: v.url,
      isExternal: true,
      meta: "投稿",
    });
  }
  for (const u of nico.mylistUpdates) {
    items.push({
      source: "niconico",
      title: u.video.title,
      date: u.addedAt,
      href: u.video.url,
      isExternal: true,
      meta: u.mylistTitle,
    });
  }
  for (const c of commentsRows) {
    const pageLabel = PAGE_LABELS[c.page_key] ?? c.page_key;
    const path = c.page_key === "home" ? "/" : `/${c.page_key}`;
    items.push({
      source: "comment",
      title: `${pageLabel}ページに新しいコメント: ${excerpt(c.body, 40)}`,
      date: c.created_at,
      href: `${path}#comments`,
      isExternal: false,
      meta: "コメント",
    });
  }

  items.sort((a, b) => (b.date > a.date ? 1 : -1));
  return items.slice(0, limit);
}
