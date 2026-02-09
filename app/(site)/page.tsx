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

export default async function HomePage() {
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
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <HomeHero
        headerImageUrl={content?.header_image_url}
        title={content?.title || undefined}
        subtitle={undefined}
      />
      {content?.body_html && (
        <div className="mb-10">
          <PageBody html={content.body_html} />
        </div>
      )}
      <HomeNotificationsSection
        items={notifications}
        youtubeVideosUrl={youtubeVideosUrl}
        niconicoVideosUrl={niconicoVideosUrl}
      />
      <HomeChangelogSection initialItems={changelog} />
      <HomeExternalLinks
        youtubeUrl={externalLinks.youtubeUrl}
        niconicoUrl={externalLinks.niconicoUrl}
        githubUrl={externalLinks.githubUrl}
        showIcons
      />
      <HomeNavCards />
      <CommentSection pageKey="home" />
    </div>
  );
}
