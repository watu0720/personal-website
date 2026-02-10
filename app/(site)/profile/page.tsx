import type { Metadata } from "next";
import Image from "next/image";
import { getPageContent } from "@/lib/repositories/page-contents";
import { getMainProfile } from "@/lib/repositories/profiles";
import { getPublicAssetUrl } from "@/lib/storage-url";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { ProfileHeroCard } from "@/components/profile-hero-card";
import { AnimatedSection } from "@/components/animated-section";

export const metadata: Metadata = {
  title: "プロフィール | わっつーのHP",
  description: "わっつーの自己紹介・スキル・リンク集",
};

export default async function ProfilePage(props: any) {
  const searchParams = props?.searchParams ?? {};
  const rawQuery = typeof searchParams.q === "string" ? searchParams.q : "";
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
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      {query && (
        <p className="mb-4 text-sm text-muted-foreground">
          これらのキーワードがハイライトされています：
          <span className="font-semibold">{query}</span>
        </p>
      )}
      <ProfileHeroCard>
        <div
          className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400"
          aria-hidden
        />
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
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
        <CommentSection pageKey="profile" />
      </AnimatedSection>
    </div>
  );
}
