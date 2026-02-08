import { getPageContent } from "@/lib/repositories/page-contents";
import { getHomeNotifications } from "@/lib/services/home-notifications";
import { HomeHero } from "@/components/home/hero";
import { HomeNavCards } from "@/components/home/nav-cards";
import { HomeNotificationsSection } from "@/components/home/notifications-section";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";

export default async function HomePage() {
  const [content, notifications] = await Promise.all([
    getPageContent("home"),
    getHomeNotifications(6).catch(() => []),
  ]);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
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
      <HomeNotificationsSection items={notifications} />
      <HomeNavCards />
      <CommentSection pageKey="home" />
    </div>
  );
}
