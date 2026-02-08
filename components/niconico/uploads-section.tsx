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
              {v.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
