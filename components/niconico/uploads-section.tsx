import type { NicoVideoItem } from "@/lib/services/niconico";

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

type Props = { items: NicoVideoItem[] };

export function NiconicoUploadsSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">投稿動画</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v, i) => (
          <a
            key={v.url || i}
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
              {v.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
              )}
            </div>
            
            {/* ホバー時のボーダーグロー効果 */}
            <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/30" />
          </a>
        ))}
      </div>
    </section>
  );
}
