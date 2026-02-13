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

  const links = [
    {
      url: youtubeUrl,
      label: "YouTube マイページ",
      icon: "youtube" as const,
      hoverShadow: "hover:shadow-primary/25"
    },
    {
      url: niconicoUrl,
      label: "ニコニコ マイページ",
      icon: "niconico" as const,
      hoverShadow: "hover:shadow-accent/25"
    },
    {
      url: githubUrl,
      label: "GitHub プロフィール",
      icon: "github" as const,
      hoverShadow: "hover:shadow-muted-foreground/25"
    }
  ].filter(link => link.url);

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">外部リンク</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
          >
            {/* 背景装飾 */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
            
            <div className="relative z-10 flex items-center gap-4">
              {showIcons && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110">
                  <ServiceIcon type={link.icon} size={24} className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {link.label}
                  <svg 
                    className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground mt-1">外部サイトで開きます</p>
              </div>
            </div>
            
            {/* ホバー時のボーダーグロー効果 */}
            <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/30" />
          </a>
        ))}
      </div>
    </section>
  );
}
