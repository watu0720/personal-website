import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-4 text-2xl font-bold text-foreground">{title}</h1>
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
