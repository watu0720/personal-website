import { ServiceIcon } from "@/components/ui/service-icon";

type Props = {
  youtubeUrl?: string | null;
  niconicoUrl?: string | null;
  githubUrl?: string | null;
  /** HOMEでは true にしてアイコンを表示。他ページでは未指定でテキストのみ */
  showIcons?: boolean;
};

export function HomeExternalLinks({ youtubeUrl, niconicoUrl, githubUrl, showIcons = false }: Props) {
  const hasAny = youtubeUrl || niconicoUrl || githubUrl;
  if (!hasAny) return null;

  return (
    <div className="mb-10 flex flex-wrap gap-3">
      {youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {showIcons && <ServiceIcon type="youtube" size={24} className="h-6 w-6" />}
          YouTube マイページ
        </a>
      )}
      {niconicoUrl && (
        <a
          href={niconicoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {showIcons && <ServiceIcon type="niconico" size={24} className="h-6 w-6" />}
          ニコニコ マイページ
        </a>
      )}
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {showIcons && <ServiceIcon type="github" size={24} className="h-6 w-6" />}
          GitHub プロフィール
        </a>
      )}
    </div>
  );
}
