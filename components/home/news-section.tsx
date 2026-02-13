"use client";

import Link from "next/link";
import { Calendar, Tag } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import type { NewsPostWithNew } from "@/lib/repositories/news-posts";

type NewsSectionProps = {
  posts: NewsPostWithNew[];
};

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

export function HomeNewsSection({ posts }: NewsSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <AnimatedSection>
      <div className="rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary md:text-2xl">お知らせ</h2>
          <Link
            href="/news"
            className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
          >
            もっと見る →
          </Link>
        </div>
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.id}`}
              className="block rounded-lg border bg-background/50 p-4 transition-all hover:border-primary/50 hover:bg-background"
            >
              <div className="flex items-start gap-3">
                {post.thumbnail_url && (
                  <div className="hidden md:block flex-shrink-0">
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="h-16 w-24 rounded object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground md:text-lg">
                      {post.title}
                    </h3>
                    {post.is_new && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(post.updated_at)}</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
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
            </Link>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
