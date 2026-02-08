/**
 * Server only. Niconico RSS. Use from API routes or Server Components.
 */

import { XMLParser } from "fast-xml-parser";
import { unstable_cache } from "next/cache";

const RSS_PARSER_OPTIONS = {
  ignoreAttributes: false,
  isArray: (name: string) => name === "item",
};

export type NicoVideoItem = {
  videoId?: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl?: string;
  description?: string;
};

export type NicoMylistUpdate = {
  mylistId: string;
  mylistTitle: string;
  addedAt: string;
  video: NicoVideoItem;
};

export type NicoMylist = {
  mylistId: string;
  title: string;
  url: string;
  items: NicoVideoItem[];
};

export type NiconicoNotifications = {
  posts: NicoVideoItem[];
  mylistUpdates: NicoMylistUpdate[];
};

export type NiconicoUploadsResponse = {
  items: NicoVideoItem[];
};

export type NiconicoMylistsResponse = {
  items: NicoMylist[];
};

function getUserId(): string {
  const id = process.env.NICONICO_USER_ID;
  if (!id) throw new Error("NICONICO_USER_ID is not set");
  return id;
}

function getMylistIds(): string[] {
  const ids = process.env.NICONICO_MYLIST_IDS;
  if (!ids) return [];
  return ids.split(",").map((s) => s.trim()).filter(Boolean);
}

function extractVideoId(link: string): string | undefined {
  const m = link.match(/watch\/(sm\d+|nm\d+)/i);
  return m ? m[1] : undefined;
}

const THUMBINFO_API = "https://ext.nicovideo.jp/api/getthumbinfo/";

function extractThumbnailUrlFromParsed(parsed: Record<string, unknown>): string | undefined {
  const roots = ["nicovideo_thumb_response", "niconico_thumb_response"];
  for (const rootKey of roots) {
    const root = parsed[rootKey];
    if (root && typeof root === "object") {
      const thumb = (root as Record<string, unknown>).thumb;
      if (thumb && typeof thumb === "object") {
        const t = thumb as Record<string, unknown>;
        const url = t.thumbnail_url ?? t.thumb_url;
        if (typeof url === "string" && url.startsWith("http")) return url;
      }
    }
  }
  return undefined;
}

async function fetchThumbnailUrlUncached(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${THUMBINFO_API}${encodeURIComponent(videoId)}`, {
      next: { revalidate: 86400 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalSite/1)" },
    });
    if (!res.ok) return undefined;
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: true });
    const parsed = parser.parse(xml) as Record<string, unknown>;
    return extractThumbnailUrlFromParsed(parsed);
  } catch {
    return undefined;
  }
}

function getThumbnailUrl(videoId: string): Promise<string | undefined> {
  return unstable_cache(
    () => fetchThumbnailUrlUncached(videoId),
    ["niconico-thumb", videoId],
    { revalidate: 86400 }
  )();
}

async function enrichItemsWithThumbnails(items: NicoVideoItem[]): Promise<NicoVideoItem[]> {
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (!item.videoId) return item;
      const thumb = await getThumbnailUrl(item.videoId);
      return { ...item, thumbnailUrl: thumb ?? item.thumbnailUrl };
    })
  );
  return enriched;
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === "string") return v.trim();
  }
  return "";
}

function parseItem(raw: Record<string, unknown>): NicoVideoItem {
  const link = pickStr(raw as Record<string, unknown>, "link", "Link");
  const videoId = extractVideoId(link);
  const publishedAt = pickStr(raw as Record<string, unknown>, "pubDate", "pubdate", "date");
  return {
    videoId,
    title: pickStr(raw as Record<string, unknown>, "title", "Title"),
    url: link || "",
    publishedAt,
    thumbnailUrl: undefined,
    description: raw?.description != null ? String(raw.description).trim() : undefined,
  };
}

function ensureItemArray(items: unknown): NicoVideoItem[] {
  if (Array.isArray(items)) return items.map((i) => parseItem(i as Record<string, unknown>));
  if (items && typeof items === "object") return [parseItem(items as Record<string, unknown>)];
  return [];
}

async function fetchRss(url: string): Promise<string> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalSite/1)" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${url}`);
  return res.text();
}

function parseRss(xml: string): { items: NicoVideoItem[]; channelTitle?: string } {
  const parser = new XMLParser(RSS_PARSER_OPTIONS);
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const root = parsed?.rss ?? (parsed?.RSS as Record<string, unknown>);
  const ch = root && typeof root === "object" && "channel" in root
    ? (root.channel as Record<string, unknown>)
    : undefined;
  const items = ensureItemArray(ch?.item);
  const channelTitle = ch?.title != null ? String(ch.title).trim() : undefined;
  return { items, channelTitle };
}

async function getNotificationsUncached(): Promise<NiconicoNotifications> {
  const userId = getUserId();
  const mylistIds = getMylistIds();
  const posts: NicoVideoItem[] = [];
  const mylistUpdates: NicoMylistUpdate[] = [];

  try {
    const userRss = `https://www.nicovideo.jp/user/${userId}/video?rss=2.0&lang=ja-jp`;
    const xml = await fetchRss(userRss);
    const { items: all } = parseRss(xml);
    const top5 = await enrichItemsWithThumbnails(all.slice(0, 5));
    posts.push(...top5);
  } catch (e) {
    console.error("Niconico user RSS:", e);
  }

  const updatesWithMeta: { mylistId: string; title: string; addedAt: string; video: NicoVideoItem }[] = [];
  for (const mylistId of mylistIds.slice(0, 5)) {
    try {
      const rssUrl = `https://www.nicovideo.jp/mylist/${mylistId}?rss=2.0&lang=ja-jp`;
      const xml = await fetchRss(rssUrl);
      const { items, channelTitle } = parseRss(xml);
      const first = items[0];
      if (first) {
        updatesWithMeta.push({
          mylistId,
          title: channelTitle ?? `マイリスト ${mylistId}`,
          addedAt: first.publishedAt,
          video: first,
        });
      }
    } catch (e) {
      console.error("Niconico mylist RSS:", mylistId, e);
    }
  }
  updatesWithMeta.sort((a, b) => (b.addedAt > a.addedAt ? 1 : -1));
  const enrichedUpdates = await enrichItemsWithThumbnails(
    updatesWithMeta.slice(0, 5).map((u) => u.video)
  );
  for (let i = 0; i < enrichedUpdates.length; i++) {
    const u = updatesWithMeta[i];
    if (u) {
      mylistUpdates.push({
        mylistId: u.mylistId,
        mylistTitle: u.title,
        addedAt: u.addedAt,
        video: enrichedUpdates[i]!,
      });
    }
  }

  return { posts, mylistUpdates };
}

export async function getNiconicoNotifications(): Promise<NiconicoNotifications> {
  try {
    return await unstable_cache(getNotificationsUncached, ["niconico-notifications"], {
      revalidate: 300,
    })();
  } catch {
    return { posts: [], mylistUpdates: [] };
  }
}

const UPLOADS_MAX = 24;

async function getUploadsUncached(): Promise<NiconicoUploadsResponse> {
  const userId = getUserId();
  const userRss = `https://www.nicovideo.jp/user/${userId}/video?rss=2.0&lang=ja-jp`;
  const xml = await fetchRss(userRss);
  const { items } = parseRss(xml);
  const enriched = await enrichItemsWithThumbnails(items.slice(0, UPLOADS_MAX));
  return { items: enriched };
}

export async function getNiconicoUploads(): Promise<NiconicoUploadsResponse> {
  try {
    return await unstable_cache(getUploadsUncached, ["niconico-uploads"], {
      revalidate: 600,
    })();
  } catch {
    return { items: [] };
  }
}

const MYLIST_ITEMS_MAX = 12;

async function getMylistsUncached(): Promise<NiconicoMylistsResponse> {
  const mylistIds = getMylistIds();
  const items: NicoMylist[] = [];
  for (const mylistId of mylistIds.slice(0, 10)) {
    try {
      const rssUrl = `https://www.nicovideo.jp/mylist/${mylistId}?rss=2.0&lang=ja-jp`;
      const xml = await fetchRss(rssUrl);
      const { items: videos, channelTitle } = parseRss(xml);
      const enrichedVideos = await enrichItemsWithThumbnails(videos.slice(0, MYLIST_ITEMS_MAX));
      items.push({
        mylistId,
        title: channelTitle ?? `マイリスト ${mylistId}`,
        url: `https://www.nicovideo.jp/mylist/${mylistId}`,
        items: enrichedVideos,
      });
    } catch (e) {
      console.error("Niconico mylist RSS:", mylistId, e);
    }
  }
  return { items };
}

export async function getNiconicoMylists(): Promise<NiconicoMylistsResponse> {
  try {
    return await unstable_cache(getMylistsUncached, ["niconico-mylists"], {
      revalidate: 600,
    })();
  } catch {
    return { items: [] };
  }
}
