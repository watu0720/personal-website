import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { getYouTubeNotifications, getYouTubeUploads, getYouTubePlaylists } from "@/lib/services/youtube";
import { YouTubeNotificationsSection } from "@/components/youtube/notifications-section";
import { YouTubeUploadsSection } from "@/components/youtube/uploads-section";
import { YouTubePlaylistsSection } from "@/components/youtube/playlists-section";

export const metadata: Metadata = {
  title: "YouTube | わっつーのHP",
  description: "YouTube投稿動画一覧",
};

export default async function YoutubePage() {
  const content = await getPageContent("youtube");
  const title = content?.title ?? "YouTube";

  const [notifications, uploads, playlists] = await Promise.all([
    getYouTubeNotifications().catch(() => ({ posts: [], playlistUpdates: [] })),
    getYouTubeUploads().catch(() => ({ items: [], nextPageToken: undefined })),
    getYouTubePlaylists().catch(() => ({ items: [], nextPageToken: undefined })),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-4 text-2xl font-bold text-foreground">{title}</h1>
      {content?.body_html && (
        <div className="mb-8">
          <PageBody html={content.body_html} />
        </div>
      )}

      <YouTubeNotificationsSection data={notifications} />
      <YouTubeUploadsSection
        initialItems={uploads.items}
        initialNextPageToken={uploads.nextPageToken}
      />
      <YouTubePlaylistsSection items={playlists.items} />

      <CommentSection pageKey="youtube" />
    </div>
  );
}
