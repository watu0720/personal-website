import Link from "next/link";
import type { NotificationItem } from "@/lib/services/home-notifications";
import { StaggerList } from "@/components/motion/StaggerList";

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
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">最新の通知</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      
      <StaggerList>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((n, i) => {
            const isNewItem = isNew(n.date, 7);
            const content = (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium">
                    {sourceLabel(n.source)}
                  </span>
                  {n.meta && <span className="text-muted-foreground/70">· {n.meta}</span>}
                  <span className="text-muted-foreground/70">{formatDate(n.date)}</span>
                  {isNewItem && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary to-accent px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                      NEW
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-foreground leading-relaxed">{n.title}</p>
              </>
            );
            
            return (
              <div 
                key={`${n.source}-${n.date}-${i}`} 
                data-stagger-item 
                className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/80 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
              >
                {/* 背景装飾 */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
                
                <div className="relative z-10">
                  {n.isExternal ? (
                    <a
                      href={n.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {content}
                    </a>
                  ) : (
                    <Link href={n.href} className="block">
                      {content}
                    </Link>
                  )}
                </div>
                
                {/* ホバー時のボーダーグロー効果 */}
                <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/30" />
              </div>
            );
          })}
        </div>
      </StaggerList>
      
      <div className="mt-8 flex flex-wrap gap-4">
        {youtubeVideosUrl ? (
          <a 
            href={youtubeVideosUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
          >
            YouTube もっと見る →
          </a>
        ) : (
          <Link 
            href="/youtube/videos" 
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
          >
            YouTube もっと見る →
          </Link>
        )}
        {niconicoVideosUrl ? (
          <a 
            href={niconicoVideosUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent/80 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 hover:scale-105"
          >
            ニコニコ もっと見る →
          </a>
        ) : (
          <Link 
            href="/niconico/videos" 
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent/80 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 hover:scale-105"
          >
            ニコニコ もっと見る →
          </Link>
        )}
      </div>
    </section>
  );
}
