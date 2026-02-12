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
import { PageMotion } from "@/components/motion/PageMotion";

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
    <PageMotion>
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-80 h-80 rounded-full bg-accent/4 blur-3xl" />
        <div className="absolute bottom-[20%] right-[30%] w-64 h-64 rounded-full bg-primary/3 blur-2xl" />
        <div className="absolute top-[65%] right-[15%] w-48 h-48 rounded-full bg-accent/2 blur-xl" />
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

        <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
          <CommentSection pageKey="niconico" />
        </div>
      </div>
    </PageMotion>
  );
}
