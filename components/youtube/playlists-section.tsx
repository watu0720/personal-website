import type { PlaylistItem } from "@/lib/services/youtube";

type Props = { items: PlaylistItem[] };

export function YouTubePlaylistsSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">プレイリスト</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((pl) => (
          <a
            key={pl.playlistId}
            href={pl.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/50"
          >
            {pl.thumbnailUrl && (
              <img
                src={pl.thumbnailUrl}
                alt=""
                className="h-28 w-full object-cover"
                width={320}
                height={112}
              />
            )}
            <div className="flex flex-1 flex-col p-4">
              <span className="font-medium text-foreground line-clamp-2">{pl.title}</span>
              <span className="mt-1 text-sm text-muted-foreground">{pl.itemCount} 本の動画</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
