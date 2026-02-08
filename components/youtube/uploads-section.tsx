"use client";

import { useState } from "react";
import type { VideoItem } from "@/lib/services/youtube";

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  initialItems: VideoItem[];
  initialNextPageToken?: string;
};

export function YouTubeUploadsSection({ initialItems, initialNextPageToken }: Props) {
  const [items, setItems] = useState<VideoItem[]>(initialItems);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialNextPageToken);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!nextPageToken || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageToken: nextPageToken });
      const res = await fetch(`/api/youtube/uploads?${params}`);
      const data = await res.json();
      if (Array.isArray(data.items)) setItems((prev) => [...prev, ...data.items]);
      setNextPageToken(data.nextPageToken ?? undefined);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">投稿動画</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <a
            key={v.videoId}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/50"
          >
            {v.thumbnailUrl && (
              <img
                src={v.thumbnailUrl}
                alt=""
                className="h-36 w-full object-cover"
                width={400}
                height={180}
              />
            )}
            <div className="flex flex-1 flex-col p-3">
              <span className="line-clamp-2 font-medium text-foreground">{v.title}</span>
              <span className="mt-1 text-xs text-muted-foreground">{formatDate(v.publishedAt)}</span>
            </div>
          </a>
        ))}
      </div>
      {nextPageToken && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border bg-card px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading ? "読み込み中…" : "もっと見る"}
          </button>
        </div>
      )}
    </section>
  );
}
