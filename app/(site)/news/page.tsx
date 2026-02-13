import { createClient } from "@/lib/supabase/server";
import { getNewsPosts, getAllTags } from "@/lib/repositories/news-posts";
import Link from "next/link";
import { Calendar, Tag } from "lucide-react";
import { PageMotion } from "@/components/motion/PageMotion";
import { AnimatedSection } from "@/components/animated-section";

const ITEMS_PER_PAGE = 20;

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function isNew(updatedAt: string): boolean {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return new Date(updatedAt) >= twoWeeksAgo;
}

export default async function NewsListPage(props: {
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const tag = searchParams.tag;
  const search = searchParams.q;

  const supabase = await createClient();
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const tags = tag ? [tag] : undefined;
  const { posts, total } = await getNewsPosts(supabase, {
    tags,
    search,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const allTags = await getAllTags(supabase);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <PageMotion>
      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <AnimatedSection className="mb-6 md:mb-8">
          <h1 className="mb-2 text-2xl md:text-3xl font-bold text-primary">お知らせ</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            最新のお知らせや更新情報をお届けします。
          </p>
          <div className="mt-2 h-0.5 w-16 md:w-24 bg-orange-500 rounded-full" />
        </AnimatedSection>

        {/* 検索・フィルタ */}
        <AnimatedSection className="mb-6">
          <div className="rounded-2xl border bg-card p-4 md:p-6">
            <form method="get" action="/news" className="space-y-4">
              <div>
                <label htmlFor="search" className="mb-2 block text-sm font-medium">
                  検索
                </label>
                <input
                  id="search"
                  name="q"
                  type="text"
                  defaultValue={search}
                  placeholder="タイトル・本文で検索"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                />
              </div>
              {allTags.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium">タグ</label>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/news"
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        !tag
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      すべて
                    </Link>
                    {allTags.map((t) => (
                      <Link
                        key={t}
                        href={`/news?tag=${encodeURIComponent(t)}`}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          tag === t
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                検索
              </button>
            </form>
          </div>
        </AnimatedSection>

        {/* 記事一覧 */}
        <AnimatedSection className="mb-6">
          {posts.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <p className="text-muted-foreground">お知らせがありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="group relative block overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/80 p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
                >
                  {/* 背景装飾 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    {post.thumbnail_url && (
                      <div className="w-full sm:w-auto flex-shrink-0">
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full sm:w-32 h-40 sm:h-24 rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground break-words">
                          {post.title}
                        </h2>
                        {isNew(post.updated_at) && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.updated_at)}</span>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <div className="flex flex-wrap gap-1">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-muted px-1.5 py-0.5"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* ホバー時のボーダーグロー効果 */}
                  <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/30" />
                </Link>
              ))}
            </div>
          )}
        </AnimatedSection>

        {/* ページネーション */}
        {totalPages > 1 && (
          <AnimatedSection>
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/news?page=${page - 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
                >
                  前へ
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/news?page=${page + 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
                >
                  次へ
                </Link>
              )}
            </div>
          </AnimatedSection>
        )}
      </div>
    </PageMotion>
  );
}
