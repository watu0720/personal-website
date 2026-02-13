"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { LinkPreview } from "@/lib/services/link-preview";

type LinkPreviewCardProps = {
  url: string;
};

export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="my-2 rounded-lg border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const displayTitle = preview.title || new URL(url).hostname;
  const displayDescription = preview.description || null;
  const displayImage = preview.image_url || null;
  const displaySiteName = preview.site_name || new URL(url).hostname.replace(/^www\./, "");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-2 block rounded-lg border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex gap-3 p-3">
        {displayImage && (
          <div className="hidden md:block flex-shrink-0">
            <img
              src={displayImage}
              alt={displayTitle || ""}
              className="h-20 w-32 rounded object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{displaySiteName}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
          <h4 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">
            {displayTitle}
          </h4>
          {displayDescription && (
            <p className="text-xs text-muted-foreground line-clamp-2">{displayDescription}</p>
          )}
        </div>
      </div>
    </a>
  );
}
