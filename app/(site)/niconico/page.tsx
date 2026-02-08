import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { getNiconicoNotifications, getNiconicoUploads, getNiconicoMylists } from "@/lib/services/niconico";
import { NiconicoNotificationsSection } from "@/components/niconico/notifications-section";
import { NiconicoUploadsSection } from "@/components/niconico/uploads-section";
import { NiconicoMylistsSection } from "@/components/niconico/mylists-section";

export const metadata: Metadata = {
  title: "ニコニコ動画 | わっつーのHP",
  description: "ニコニコ動画投稿一覧",
};

export default async function NiconicoPage() {
  const content = await getPageContent("niconico");
  const title = content?.title ?? "ニコニコ動画";

  const [notifications, uploads, mylists] = await Promise.all([
    getNiconicoNotifications().catch(() => ({ posts: [], mylistUpdates: [] })),
    getNiconicoUploads().catch(() => ({ items: [] })),
    getNiconicoMylists().catch(() => ({ items: [] })),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-4 text-2xl font-bold text-foreground">{title}</h1>
      {content?.body_html && (
        <div className="mb-8">
          <PageBody html={content.body_html} />
        </div>
      )}

      <NiconicoNotificationsSection data={notifications} />
      <NiconicoUploadsSection items={uploads.items} />
      <NiconicoMylistsSection items={mylists.items} />

      <CommentSection pageKey="niconico" />
    </div>
  );
}
