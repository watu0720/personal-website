import type { Metadata } from "next";
import Image from "next/image";
import { getPageContent } from "@/lib/repositories/page-contents";
import { getMainProfile } from "@/lib/repositories/profiles";
import { getPublicAssetUrl } from "@/lib/storage-url";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";

export const metadata: Metadata = {
  title: "プロフィール | わっつーのHP",
  description: "わっつーの自己紹介・スキル・リンク集",
};

export default async function ProfilePage() {
  const [content, mainProfile] = await Promise.all([
    getPageContent("profile"),
    getMainProfile(),
  ]);
  const title = content?.title ?? "プロフィール";
  const avatarUrl = mainProfile?.avatar_path
    ? getPublicAssetUrl(mainProfile.avatar_path, Date.now().toString())
    : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
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
        <div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
          {mainProfile?.bio && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mainProfile.bio}
            </p>
          )}
        </div>
      </div>
      {content?.body_html && <PageBody html={content.body_html} />}
      <CommentSection pageKey="profile" />
    </div>
  );
}
