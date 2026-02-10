import type { NicoMylist } from "@/lib/services/niconico";

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

type Props = { items: NicoMylist[] };

export function NiconicoMylistsSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">マイリスト</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div
            key={m.mylistId}
            className="flex flex-col overflow-hidden rounded-xl border bg-card"
          >
            <div className="border-b p-4">
              <h3 className="font-medium text-foreground">{m.title}</h3>
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                ニコニコで見る →
              </a>
            </div>
            <ul className="flex-1 overflow-auto p-2">
              {m.items.slice(0, 5).map((v, i) => (
                <li key={v.url || i} className="border-b border-transparent py-1 last:border-0">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded p-1 text-sm transition-colors hover:bg-muted/50"
                  >
                    {v.thumbnailUrl && (
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        className="h-10 w-16 shrink-0 rounded object-cover"
                        width={64}
                        height={40}
                      />
                    )}
                    <span className="line-clamp-1 flex-1 text-foreground">{v.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(v.publishedAt)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
