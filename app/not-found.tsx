import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - ページが見つかりません | わっつーのHP",
  description: "お探しのページは存在しないか、移動された可能性があります。",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-foreground md:text-8xl">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground md:text-3xl">
          ページが見つかりません
        </h2>
        <p className="mb-8 text-muted-foreground md:text-lg">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:text-lg"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
