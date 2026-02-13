import { createClient } from "@/lib/supabase/server";
import { getNewsPostById } from "@/lib/repositories/news-posts";
import { notFound } from "next/navigation";
import { Calendar, Tag } from "lucide-react";
import { PageMotion } from "@/components/motion/PageMotion";
import { AnimatedSection } from "@/components/animated-section";
import { NewsBody } from "@/components/news-body";
import { CommentSection } from "@/components/comment-section";
import { Breadcrumb } from "@/components/breadcrumb";

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

export default async function NewsDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const post = await getNewsPostById(supabase, id);

  if (!post) {
    notFound();
  }

  return (
    <PageMotion>
      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-8 md:px-6 md:py-12">
        <AnimatedSection className="mb-4 md:mb-6">
          <Breadcrumb
            items={[
              { label: "お知らせ一覧", href: "/news" },
              { label: post.title },
            ]}
            className="mb-3 md:mb-4 text-xs sm:text-sm"
          />
        </AnimatedSection>

        {post.thumbnail_url ? (
          <AnimatedSection className="mb-4 md:mb-6">
            <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
              {/* タイトルとメタ情報のオーバーレイ（帯付き） */}
              <div className="absolute bottom-0 left-0 right-0">
                {/* 半透明の帯 */}
                <div className="bg-gradient-to-t from-black/70 via-black/60 to-black/50 backdrop-blur-sm p-4 sm:p-6 md:p-8">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words">
                      {post.title}
                    </h1>
                    {isNew(post.updated_at) && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-lg">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{formatDate(post.updated_at)}</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white"
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
            </div>
          </AnimatedSection>
        ) : (
          <>
            <AnimatedSection className="mb-3 md:mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary break-words">
                  {post.title}
                </h1>
                {isNew(post.updated_at) && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    NEW
                  </span>
                )}
              </div>
            </AnimatedSection>
            <AnimatedSection className="mb-4 md:mb-6">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{formatDate(post.updated_at)}</span>
                </div>
                {post.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AnimatedSection>
          </>
        )}

        <AnimatedSection className="mb-6 md:mb-8">
          <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 md:p-8">
            <NewsBody html={post.body_html} />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 md:p-8">
            <CommentSection pageKey={`news:${post.id}`} />
          </div>
        </AnimatedSection>
      </div>
    </PageMotion>
  );
}
