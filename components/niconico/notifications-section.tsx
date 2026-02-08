import type { NiconicoNotifications } from "@/lib/services/niconico";

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

type Props = { data: NiconicoNotifications };

export function NiconicoNotificationsSection({ data }: Props) {
  const { posts, mylistUpdates } = data;
  const hasAny = posts.length > 0 || mylistUpdates.length > 0;
  if (!hasAny) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">通知</h2>
      <div className="space-y-6">
        {posts.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">投稿（新着5件）</h3>
            <ul className="space-y-2">
              {posts.map((v, i) => (
                <li key={v.url || i}>
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
        {mylistUpdates.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">マイリスト更新（5件）</h3>
            <ul className="space-y-2">
              {mylistUpdates.map((u) => (
                <li key={`${u.mylistId}-${u.video.url}`}>
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
                        {u.mylistTitle} に追加 · {formatDate(u.addedAt)}
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
