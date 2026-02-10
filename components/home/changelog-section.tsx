"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";

type ChangelogItem = {
  id: string;
  title: string;
  body_html: string;
  published_at: string;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = { initialItems: ChangelogItem[] };

export function HomeChangelogSection({ initialItems }: Props) {
  const [items] = useState<ChangelogItem[]>(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [allItems, setAllItems] = useState<ChangelogItem[] | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((data) => setAllItems(Array.isArray(data) ? data : []))
      .catch(() => setAllItems([]));
  }, [modalOpen]);

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">改訂履歴</h2>
      <motion.ul
        className="flex flex-col gap-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {items.map((item) => (
          <motion.li
            key={item.id}
            variants={staggerItem}
            transition={transitionPresets.normal}
            className="rounded-xl border bg-card p-4"
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
            </div>
            <h3 className="font-medium text-foreground">{item.title}</h3>
            <div className="prose prose-sm mt-2 max-w-none text-foreground">
              <PageBody html={item.body_html} />
            </div>
          </motion.li>
        ))}
      </motion.ul>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-4 text-sm text-primary hover:underline"
      >
        もっと見る
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border bg-card shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b bg-card p-4">
              <h3 className="text-lg font-semibold text-foreground">改訂履歴 一覧</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {allItems === null ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : allItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">件はありません。</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {allItems.map((item) => (
                    <li key={item.id} className="border-b pb-4 last:border-0">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.published_at)}
                      </div>
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                      <div className="prose prose-sm mt-1 max-w-none">
                        <PageBody html={item.body_html} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
