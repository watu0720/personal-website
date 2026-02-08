import type { YouTubeNotifications } from "@/lib/services/youtube";

type Props = { data: YouTubeNotifications };

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

export function YouTubeNotificationsSection({ data }: Props) {
  const { posts, playlistUpdates } = data;
  const hasAny = posts.length > 0 || playlistUpdates.length > 0;
  if (!hasAny) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">通知</h2>
      <div className="space-y-6">
        {posts.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">投稿（新着5件）</h3>
            <ul className="space-y-2">
              {posts.map((v) => (
                <li key={v.videoId}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    {v.thumbnailUrl && (
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        className="h-12 w-20 shrink-0 rounded object-cover"
                        width={80}
                        height={48}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium text-foreground">{v.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(v.publishedAt)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {playlistUpdates.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">プレイリスト更新（5件）</h3>
            <ul className="space-y-2">
              {playlistUpdates.map((u) => (
                <li key={`${u.playlistId}-${u.video.videoId}`}>
                  <a
                    href={u.video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    {u.video.thumbnailUrl && (
                      <img
                        src={u.video.thumbnailUrl}
                        alt=""
                        className="h-12 w-20 shrink-0 rounded object-cover"
                        width={80}
                        height={48}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium text-foreground">{u.video.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.playlistTitle} に追加 · {formatDate(u.addedAt)}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
