import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentLogSection } from "@/components/comment-log-section";

const PAGE_LABELS: Record<string, string> = {
  home: "ホーム",
  profile: "プロフィール",
  youtube: "YouTube",
  niconico: "ニコニコ",
  dev: "個人開発",
};

const VALID_KEYS = Object.keys(PAGE_LABELS);

export const metadata: Metadata = {
  title: "コメントログ | わっつーのHP",
};

export default async function CommentLogPage(props: any) {
  const { params, searchParams } = props;
  const { pageKey: rawKey } = await params;
  if (!VALID_KEYS.includes(rawKey)) {
    notFound();
  }
  const pageKey = rawKey;
  const label = PAGE_LABELS[pageKey] ?? pageKey;

  const currentPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const q = searchParams.q ?? "";
  const mode = searchParams.mode === "word" ? "word" : "partial";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-2">
        <Link
          href={pageKey === "home" ? "/" : `/${pageKey}`}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-primary"
        >
          ← ページへ戻る
        </Link>
      </div>
      <h1 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
        コメントログ
      </h1>

      <CommentLogSection
        pageKey={pageKey}
        label={label}
        initialPage={currentPage}
        query={q || undefined}
        mode={mode}
      />
    </div>
  );
}

