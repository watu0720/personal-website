import Link from "next/link";
import type { NotificationItem } from "@/lib/services/home-notifications";

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

function sourceLabel(source: NotificationItem["source"]): string {
  switch (source) {
    case "youtube":
      return "YouTube";
    case "niconico":
      return "ニコニコ";
    case "comment":
      return "コメント";
    default:
      return source;
  }
}

function isNew(date: string, days: number): boolean {
  try {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  } catch {
    return false;
  }
}

type Props = {
  items: NotificationItem[];
  /** 指定時は YouTube もっと見る をこの外部URLへ（新規タブ） */
  youtubeVideosUrl?: string | null;
  /** 指定時は ニコニコ もっと見る をこの外部URLへ（新規タブ） */
  niconicoVideosUrl?: string | null;
};

export function HomeNotificationsSection({ items, youtubeVideosUrl, niconicoVideosUrl }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">最新の通知</h2>
      <div className="flex flex-col gap-3">
        {items.map((n, i) => {
          const isNewItem = isNew(n.date, 7);
          const content = (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{sourceLabel(n.source)}</span>
                {n.meta && <span>· {n.meta}</span>}
                <span>{formatDate(n.date)}</span>
                {isNewItem && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    NEW
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground">{n.title}</p>
            </>
          );
          return (
            <div key={`${n.source}-${n.date}-${i}`} className="rounded-xl border bg-card p-4">
              {n.isExternal ? (
                <a
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-colors hover:opacity-90"
                >
                  {content}
                </a>
              ) : (
                <Link href={n.href} className="block transition-colors hover:opacity-90">
                  {content}
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {youtubeVideosUrl ? (
          <a href={youtubeVideosUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            YouTube もっと見る →
          </a>
        ) : (
          <Link href="/youtube/videos" className="text-primary hover:underline">
            YouTube もっと見る →
          </Link>
        )}
        {niconicoVideosUrl ? (
          <a href={niconicoVideosUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            ニコニコ もっと見る →
          </a>
        ) : (
          <Link href="/niconico/videos" className="text-primary hover:underline">
            ニコニコ もっと見る →
          </Link>
        )}
      </div>
    </section>
  );
}
