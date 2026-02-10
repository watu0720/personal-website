import type { Metadata } from "next";
import { getPageContent } from "@/lib/repositories/page-contents";
import { ServiceIcon } from "@/components/ui/service-icon";
import { HomeExternalLinks } from "@/components/home/external-links";
import { PageBody } from "@/components/page-body";
import { CommentSection } from "@/components/comment-section";
import { getGitHubRepos } from "@/lib/services/github";
import { DevReposSection } from "@/components/dev/repos-section";
import { PageMotion } from "@/components/motion/PageMotion";

export const metadata: Metadata = {
  title: "個人開発 | わっつーのHP",
  description: "開発リポジトリ一覧",
};

export default async function DevPage(props: any) {
  const rawSearchParams = props?.searchParams;
  const resolvedSearchParams =
    rawSearchParams && typeof rawSearchParams.then === "function"
      ? await rawSearchParams
      : rawSearchParams ?? {};
  const rawQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const query = rawQuery.trim();
  const content = await getPageContent("dev");
  const title = content?.title ?? "個人開発";
  const repos = await getGitHubRepos();

  return (
    <PageMotion>
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] right-[20%] w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-[15%] left-[25%] w-72 h-72 rounded-full bg-accent/4 blur-2xl" />
        <div className="absolute top-[15%] left-[65%] w-56 h-56 rounded-full bg-primary/2 blur-xl" />
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
        <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
          <CommentSection pageKey="dev" />
        </div>
      </div>
    </PageMotion>
  );
}
