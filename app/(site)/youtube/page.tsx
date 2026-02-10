import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
import { ServiceIcon } from "@/components/ui/service-icon";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { getYouTubeNotifications, getYouTubeUploads, getYouTubePlaylists } from "@/lib/services/youtube";
import { YouTubeNotificationsSection } from "@/components/youtube/notifications-section";
import { YouTubeUploadsSection } from "@/components/youtube/uploads-section";
import { YouTubePlaylistsSection } from "@/components/youtube/playlists-section";
import { HomeExternalLinks } from "@/components/home/external-links";

export const metadata: Metadata = {
  title: "YouTube | わっつーのHP",
  description: "YouTube投稿動画一覧",
};

export default async function YoutubePage(props: any) {
  const searchParams = props?.searchParams ?? {};
  const rawQuery = typeof searchParams.q === "string" ? searchParams.q : "";
  const query = rawQuery.trim();
  const content = await getPageContent("youtube");
  const title = content?.title ?? "YouTube";

  const [notifications, uploads, playlists] = await Promise.all([
    getYouTubeNotifications().catch(() => ({ posts: [], playlistUpdates: [] })),
    getYouTubeUploads().catch(() => ({ items: [], nextPageToken: undefined })),
    getYouTubePlaylists().catch(() => ({ items: [], nextPageToken: undefined })),
  ]);

  const yId = process.env.YOUTUBE_CHANNEL_ID;
  const youtubeVideosUrl = yId ? `https://www.youtube.com/channel/${yId}/videos` : null;

  const latestUploads = uploads.items.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      {query && (
        <p className="mb-4 text-sm text-muted-foreground">
          これらのキーワードがハイライトされています：
          <span className="font-semibold">{query}</span>
        </p>
      )}
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center md:h-9 md:w-9" aria-hidden>
          <ServiceIcon type="youtube" size={32} className="h-6 w-6 md:h-7 md:w-7" />
        </span>
        {title}
      </h1>
      {content?.body_html && (
        <div className="mb-8">
          <PageBody html={content.body_html} />
        </div>
      )}

      <HomeExternalLinks youtubeUrl={yId ? `https://www.youtube.com/channel/${yId}` : null} />

      <YouTubeNotificationsSection data={notifications} />
      <YouTubeUploadsSection
        initialItems={latestUploads}
        initialNextPageToken={undefined}
        moreHref={youtubeVideosUrl ?? undefined}
      />
      <YouTubePlaylistsSection items={playlists.items} />

      <CommentSection pageKey="youtube" />
    </div>
  );
}
