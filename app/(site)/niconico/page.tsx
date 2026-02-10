import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
import { ServiceIcon } from "@/components/ui/service-icon";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { getNiconicoNotifications, getNiconicoUploads, getNiconicoMylists } from "@/lib/services/niconico";
import { NiconicoNotificationsSection } from "@/components/niconico/notifications-section";
import { NiconicoUploadsSection } from "@/components/niconico/uploads-section";
import { NiconicoMylistsSection } from "@/components/niconico/mylists-section";
import { HomeExternalLinks } from "@/components/home/external-links";

export const metadata: Metadata = {
  title: "ニコニコ動画 | わっつーのHP",
  description: "ニコニコ動画投稿一覧",
};

export default async function NiconicoPage(props: any) {
  const rawSearchParams = props?.searchParams;
  const resolvedSearchParams =
    rawSearchParams && typeof rawSearchParams.then === "function"
      ? await rawSearchParams
      : rawSearchParams ?? {};
  const rawQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const query = rawQuery.trim();
  const content = await getPageContent("niconico");
  const title = content?.title ?? "ニコニコ動画";

  const [notifications, uploads, mylists] = await Promise.all([
    getNiconicoNotifications().catch(() => ({ posts: [], mylistUpdates: [] })),
    getNiconicoUploads().catch(() => ({ items: [] })),
    getNiconicoMylists().catch(() => ({ items: [] })),
  ]);

  const nId = process.env.NICONICO_USER_ID;
  const niconicoVideosUrl = nId ? `https://www.nicovideo.jp/user/${nId}/video` : null;

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
          <ServiceIcon type="niconico" size={32} className="h-6 w-6 md:h-7 md:w-7" />
        </span>
        {title}
      </h1>
      {content?.body_html && (
        <div className="mb-8">
          <PageBody html={content.body_html} />
        </div>
      )}

      <HomeExternalLinks niconicoUrl={nId ? `https://www.nicovideo.jp/user/${nId}` : null} />

      <NiconicoNotificationsSection data={notifications} />
      <NiconicoUploadsSection items={latestUploads} />
      {niconicoVideosUrl && (
        <div className="mb-10 flex justify-center">
          <a
            href={niconicoVideosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border bg-card px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            もっと見る
          </a>
        </div>
      )}
      <NiconicoMylistsSection items={mylists.items} />

      <CommentSection pageKey="niconico" />
    </div>
  );
}
