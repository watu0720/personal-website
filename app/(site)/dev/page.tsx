import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
import { ServiceIcon } from "@/components/ui/service-icon";
import { HomeExternalLinks } from "@/components/home/external-links";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { getGitHubRepos } from "@/lib/services/github";
import { DevReposSection } from "@/components/dev/repos-section";

export const metadata: Metadata = {
  title: "個人開発 | わっつーのHP",
  description: "開発リポジトリ一覧",
};

export default async function DevPage() {
  const content = await getPageContent("dev");
  const title = content?.title ?? "個人開発";
  const repos = await getGitHubRepos();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center md:h-9 md:w-9" aria-hidden>
          <ServiceIcon type="github" size={32} className="h-6 w-6 md:h-7 md:w-7" />
        </span>
        {title}
      </h1>
      <HomeExternalLinks githubUrl={process.env.GITHUB_USERNAME ? `https://github.com/${process.env.GITHUB_USERNAME}` : null} />
      {content?.body_html && (
        <div className="mb-8">
          <PageBody html={content.body_html} />
        </div>
      )}
      <DevReposSection items={repos.items} error={repos.error} />
      <CommentSection pageKey="dev" />
    </div>
  );
}
