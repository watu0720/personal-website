/**
 * Server only. YouTube Data API v3. Use from API routes or Server Components.
 */

import { unstable_cache } from "next/cache";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

export type VideoItem = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string;
  description?: string;
};

export type PlaylistItem = {
  playlistId: string;
  title: string;
  url: string;
  itemCount: number;
  thumbnailUrl: string;
};

export type PlaylistUpdateItem = {
  playlistId: string;
  playlistTitle: string;
  addedAt: string;
  video: VideoItem;
};

export type YouTubeNotifications = {
  posts: VideoItem[];
  playlistUpdates: PlaylistUpdateItem[];
};

export type YouTubeUploadsResponse = {
  items: VideoItem[];
  nextPageToken?: string;
};

export type YouTubePlaylistsResponse = {
  items: PlaylistItem[];
  nextPageToken?: string;
};

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

function getChannelId(): string {
  const id = process.env.YOUTUBE_CHANNEL_ID;
  if (!id) throw new Error("YOUTUBE_CHANNEL_ID is not set");
  return id;
}

function getNotifyPlaylistIds(): string[] {
  const ids = process.env.YOUTUBE_NOTIFY_PLAYLIST_IDS;
  if (!ids) return [];
  return ids.split(",").map((s) => s.trim()).filter(Boolean);
}

async function fetchYoutube<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getApiKey();
  const url = `${YOUTUBE_API}${path}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

function toVideoItem(snippet: {
  resourceId?: { videoId?: string };
  thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  title?: string;
  publishedAt?: string;
  description?: string;
}, videoId?: string): VideoItem {
  const id = videoId || snippet.resourceId?.videoId || "";
  return {
    videoId: id,
    title: snippet.title || "",
    url: `https://www.youtube.com/watch?v=${id}`,
    publishedAt: snippet.publishedAt || "",
    thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
    description: snippet.description,
  };
}

async function getYouTubeNotificationsUncached(): Promise<YouTubeNotifications> {
  const channelId = getChannelId();
  const playlistIds = getNotifyPlaylistIds();

  const posts: VideoItem[] = [];
  const playlistUpdates: PlaylistUpdateItem[] = [];

  try {
    const searchRes = await fetchYoutube<{ items?: { id?: { videoId?: string }; snippet?: unknown }[] }>("/search", {
      part: "snippet",
      channelId,
      order: "date",
      type: "video",
      maxResults: "5",
    });
    for (const item of searchRes.items || []) {
      if (item.id?.videoId && item.snippet) {
        posts.push(toVideoItem(item.snippet as Parameters<typeof toVideoItem>[0], item.id.videoId));
      }
    }
  } catch (e) {
    console.error("YouTube notifications posts:", e);
  }

  let playlistTitles: Record<string, string> = {};
  if (playlistIds.length > 0) {
    try {
      const plRes = await fetchYoutube<{ items?: { id?: string; snippet?: { title?: string } }[] }>("/playlists", {
        part: "snippet",
        id: playlistIds.slice(0, 5).join(","),
      });
      for (const pl of plRes.items || []) {
        if (pl.id) playlistTitles[pl.id] = pl.snippet?.title ?? pl.id;
      }
    } catch (e) {
      console.error("YouTube playlists titles:", e);
    }
  }

  for (const playlistId of playlistIds.slice(0, 5)) {
    try {
      const listRes = await fetchYoutube<{ items?: { snippet: Parameters<typeof toVideoItem>[0] }[] }>("/playlistItems", {
        part: "snippet",
        playlistId,
        maxResults: "1",
      });
      const items = listRes.items || [];
      const first = items[0];
      if (first?.snippet) {
        const sn = first.snippet;
        playlistUpdates.push({
          playlistId,
          playlistTitle: playlistTitles[playlistId] ?? playlistId,
          addedAt: sn.publishedAt || "",
          video: toVideoItem(sn, sn.resourceId?.videoId),
        });
      }
    } catch (e) {
      console.error("YouTube playlistItems:", playlistId, e);
    }
  }

  playlistUpdates.sort((a, b) => (b.addedAt > a.addedAt ? 1 : -1));
  const playlistUpdatesTop = playlistUpdates.slice(0, 5);

  return { posts, playlistUpdates: playlistUpdatesTop };
}

export async function getYouTubeNotifications(): Promise<YouTubeNotifications> {
  try {
    return await unstable_cache(
      getYouTubeNotificationsUncached,
      ["youtube-notifications"],
      { revalidate: 300 }
    )();
  } catch {
    return { posts: [], playlistUpdates: [] };
  }
}

async function getYouTubeUploadsUncached(pageToken?: string): Promise<YouTubeUploadsResponse> {
  const channelId = getChannelId();
  const searchRes = await fetchYoutube<{
    items?: { id?: { videoId?: string }; snippet?: Parameters<typeof toVideoItem>[0][] };
    nextPageToken?: string;
  }>("/search", {
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: "12",
    ...(pageToken ? { pageToken } : {}),
  });
  const rawItems = searchRes.items;
  const arr = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const items: VideoItem[] = [];
  for (const item of arr) {
    if (item.id?.videoId && item.snippet) {
      items.push(toVideoItem(item.snippet, item.id.videoId));
    }
  }
  return { items, nextPageToken: searchRes.nextPageToken };
}

export async function getYouTubeUploads(pageToken?: string): Promise<YouTubeUploadsResponse> {
  try {
    return await unstable_cache(
      () => getYouTubeUploadsUncached(pageToken),
      ["youtube-uploads", pageToken ?? ""],
      { revalidate: 600 }
    )();
  } catch {
    return { items: [] };
  }
}

async function getYouTubePlaylistsUncached(pageToken?: string): Promise<YouTubePlaylistsResponse> {
  const channelId = getChannelId();
  const res = await fetchYoutube<{
    items?: { id?: string; snippet?: { title?: string; thumbnails?: { medium?: { url?: string } }; localized?: { title?: string } };
      contentDetails?: { itemCount?: number } };
    nextPageToken?: string;
  }>("/playlists", {
    part: "snippet,contentDetails",
    channelId,
    maxResults: "20",
    ...(pageToken ? { pageToken } : {}),
  });
  const rawItems = res.items;
  const arr = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const items: PlaylistItem[] = [];
  for (const item of arr) {
    const id = item.id;
    if (!id) continue;
    const sn = item.snippet;
    const cd = item.contentDetails;
    items.push({
      playlistId: id,
      title: sn?.localized?.title || sn?.title || "",
      url: `https://www.youtube.com/playlist?list=${id}`,
      itemCount: cd?.itemCount ?? 0,
      thumbnailUrl: sn?.thumbnails?.medium?.url || "",
    });
  }
  return { items, nextPageToken: res.nextPageToken };
}

export async function getYouTubePlaylists(pageToken?: string): Promise<YouTubePlaylistsResponse> {
  try {
    return await unstable_cache(
      () => getYouTubePlaylistsUncached(pageToken),
      ["youtube-playlists", pageToken ?? ""],
      { revalidate: 1800 }
    )();
  } catch {
    return { items: [] };
  }
}
