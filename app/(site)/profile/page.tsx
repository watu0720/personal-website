import type { Metadata } from "next";
import Image from "next/image";
import { getPageContent } from "@/lib/repositories/page-contents";
import { getMainProfile } from "@/lib/repositories/profiles";
import { getPublicAssetUrl } from "@/lib/storage-url";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { ProfileHeroCard } from "@/components/profile-hero-card";
import { AnimatedSection } from "@/components/animated-section";
import { PageMotion } from "@/components/motion/PageMotion";
import { AnimatedGradientHeader } from "@/components/motion/AnimatedGradientHeader";

export const metadata: Metadata = {
  title: "プロフィール | わっつーのHP",
  description: "わっつーの自己紹介・スキル・リンク集",
};

export default async function ProfilePage(props: any) {
  const rawSearchParams = props?.searchParams;
  const resolvedSearchParams =
    rawSearchParams && typeof rawSearchParams.then === "function"
      ? await rawSearchParams
      : rawSearchParams ?? {};
  const rawQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const query = rawQuery.trim();
  const [content, mainProfile] = await Promise.all([
    getPageContent("profile"),
    getMainProfile(),
  ]);
  const title = content?.title ?? "プロフィール";
  const avatarUrl = mainProfile?.avatar_path
    ? getPublicAssetUrl(mainProfile.avatar_path, Date.now().toString())
    : null;

  return (
    <PageMotion>
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[25%] left-[15%] w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-[30%] right-[20%] w-48 h-48 rounded-full bg-accent/4 blur-2xl" />
        <div className="absolute top-[65%] left-[65%] w-32 h-32 rounded-full bg-primary/2 blur-xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
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
      <ProfileHeroCard>
        <AnimatedGradientHeader className="h-3 w-full" />
        <div className="flex min-w-0 flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="プロフィール"
              width={120}
              height={120}
              className="rounded-2xl"
              unoptimized
            />
          ) : (
            <div className="h-[120px] w-[120px] rounded-2xl bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center md:h-9 md:w-9" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              {title}
            </h1>
            {mainProfile?.bio && (
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {mainProfile.bio}
              </p>
            )}
            {content?.body_html && (
              <div className="prose prose-sm max-w-none text-foreground prose-p:my-2 prose-p:text-sm prose-p:leading-relaxed prose-p:text-muted-foreground">
                <PageBody html={content.body_html} />
              </div>
            )}
          </div>
        </div>
      </ProfileHeroCard>
        <AnimatedSection>
          <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
            <CommentSection pageKey="profile" />
          </div>
        </AnimatedSection>
      </div>
    </PageMotion>
  );
}
