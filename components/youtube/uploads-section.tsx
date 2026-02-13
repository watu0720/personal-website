"use client";

import Link from "next/link";
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
  /** When set, show "もっと見る" as link to this href instead of load-more button. */
  moreHref?: string;
};

export function YouTubeUploadsSection({ initialItems, initialNextPageToken, moreHref }: Props) {
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
            className="group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/80 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
          >
            {/* 背景装飾 */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
            
            {v.thumbnailUrl && (
              <div className="relative z-10 overflow-hidden">
                <img
                  src={v.thumbnailUrl}
                  alt=""
                  className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  width={400}
                  height={180}
                />
              </div>
            )}
            <div className="relative z-10 flex flex-1 flex-col p-3">
              <span className="line-clamp-2 font-medium text-foreground">{v.title}</span>
              <span className="mt-1 text-xs text-muted-foreground">{formatDate(v.publishedAt)}</span>
            </div>
            
            {/* ホバー時のボーダーグロー効果 */}
            <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/30" />
          </a>
        ))}
      </div>
      {moreHref ? (
        <div className="mt-4 text-center">
          {moreHref.startsWith("http") ? (
            <a
              href={moreHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border bg-card px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              もっと見る
            </a>
          ) : (
            <Link
              href={moreHref}
              className="inline-block rounded-lg border bg-card px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              もっと見る
            </Link>
          )}
        </div>
      ) : nextPageToken ? (
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
      ) : null}
    </section>
  );
}
