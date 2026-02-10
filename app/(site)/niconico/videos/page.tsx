import type { Metadata } from "next";
import Link from "next/link";
import { getNiconicoUploads } from "@/lib/services/niconico";
import { ServiceIcon } from "@/components/ui/service-icon";
import { NiconicoUploadsSection } from "@/components/niconico/uploads-section";

export const metadata: Metadata = {
  title: "ニコニコ 投稿一覧 | わっつーのHP",
  description: "ニコニコ動画投稿一覧",
};

export default async function NiconicoVideosPage() {
  const uploads = await getNiconicoUploads().catch(() => ({ items: [] }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/niconico" className="text-sm text-muted-foreground hover:underline">
          ← ニコニコ動画
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center md:h-9 md:w-9" aria-hidden>
          <ServiceIcon type="niconico" size={32} className="h-6 w-6 md:h-7 md:w-7" />
        </span>
        投稿動画一覧
      </h1>
      <NiconicoUploadsSection items={uploads.items} />
    </div>
  );
}
