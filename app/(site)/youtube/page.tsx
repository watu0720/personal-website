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
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "YouTube | わっつーのHP",
  description: "YouTube投稿動画一覧",
};

export default async function YoutubePage(props: any) {
  const rawSearchParams = props?.searchParams;
  const resolvedSearchParams =
    rawSearchParams && typeof rawSearchParams.then === "function"
      ? await rawSearchParams
      : rawSearchParams ?? {};
  const rawQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
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
    <PageMotion>
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[25%] w-72 h-72 rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute bottom-[25%] left-[15%] w-56 h-56 rounded-full bg-accent/3 blur-2xl" />
        <div className="absolute top-[50%] left-[50%] w-40 h-40 rounded-full bg-primary/2 blur-xl" />
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

        <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
          <CommentSection pageKey="youtube" />
        </div>
      </div>
    </PageMotion>
  );
}
