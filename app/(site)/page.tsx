import { createClient } from "@/lib/supabase/server";
import { getPageContent } from "@/lib/repositories/page-contents";
import { getChangelog } from "@/lib/repositories/changelog";
import { getHomeNotifications } from "@/lib/services/home-notifications";
import { HomeHero } from "@/components/home/hero";
import { HomeNavCards } from "@/components/home/nav-cards";
import { HomeNotificationsSection } from "@/components/home/notifications-section";
import { HomeChangelogSection } from "@/components/home/changelog-section";
import { HomeExternalLinks } from "@/components/home/external-links";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { AnimatedSection } from "@/components/animated-section";
import { PageMotion } from "@/components/motion/PageMotion";

export default async function HomePage(props: any) {
  const rawSearchParams = props?.searchParams;
  const resolvedSearchParams =
    rawSearchParams && typeof rawSearchParams.then === "function"
      ? await rawSearchParams
      : rawSearchParams ?? {};
  const rawQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const query = rawQuery.trim();
  const supabase = await createClient();
  const [content, notifications, changelog] = await Promise.all([
    getPageContent("home"),
    getHomeNotifications(6).catch(() => []),
    getChangelog(supabase, { limit: 5 }).catch(() => []),
  ]);
  const yId = process.env.YOUTUBE_CHANNEL_ID;
  const nId = process.env.NICONICO_USER_ID;
  const gUser = process.env.GITHUB_USERNAME;
  const externalLinks = {
    youtubeUrl: yId ? `https://www.youtube.com/channel/${yId}` : null,
    niconicoUrl: nId ? `https://www.nicovideo.jp/user/${nId}` : null,
    githubUrl: gUser ? `https://github.com/${gUser}` : null,
  };
  const youtubeVideosUrl = yId ? `https://www.youtube.com/channel/${yId}/videos` : null;
  const niconicoVideosUrl = nId ? `https://www.nicovideo.jp/user/${nId}/video` : null;
  return (
    <PageMotion>
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[24rem] h-[24rem] rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute top-[30%] right-[20%] w-[20rem] h-[20rem] rounded-full bg-accent/4 blur-3xl" />
        <div className="absolute bottom-[20%] left-[30%] w-[18rem] h-[18rem] rounded-full bg-primary/2 blur-3xl" />
        
        {/* グリッドパターン */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem'
        }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {query && (
          <div className="mb-6 rounded-2xl border bg-gradient-to-r from-primary/10 to-accent/10 p-4">
            <p className="text-sm text-muted-foreground">
              これらのキーワードがハイライトされています：
              <span className="ml-2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {query}
              </span>
            </p>
          </div>
        )}
        
        <HomeHero
          headerImageUrl={content?.header_image_url}
          title={content?.title || undefined}
          subtitle={undefined}
        />
        
        {content?.body_html && (
          <AnimatedSection className="mb-12">
            <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
              <PageBody html={content.body_html} />
            </div>
          </AnimatedSection>
        )}
        
        <AnimatedSection>
          <HomeNotificationsSection
            items={notifications}
            youtubeVideosUrl={youtubeVideosUrl}
            niconicoVideosUrl={niconicoVideosUrl}
          />
        </AnimatedSection>
        
        <AnimatedSection>
          <HomeChangelogSection initialItems={changelog} />
        </AnimatedSection>
        
        <AnimatedSection>
          <HomeExternalLinks
            youtubeUrl={externalLinks.youtubeUrl}
            niconicoUrl={externalLinks.niconicoUrl}
            githubUrl={externalLinks.githubUrl}
            showIcons
          />
        </AnimatedSection>
        
        <AnimatedSection>
          <HomeNavCards />
        </AnimatedSection>
        
        <AnimatedSection>
          <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
            <CommentSection pageKey="home" />
          </div>
        </AnimatedSection>
      </div>
    </PageMotion>
  );
}
