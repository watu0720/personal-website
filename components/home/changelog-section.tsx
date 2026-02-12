"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";
import { ModalMotion } from "@/components/motion/ModalMotion";

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
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">改訂履歴</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      
      <motion.ul
        className="flex flex-col gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {items.map((item) => (
          <motion.li
            key={item.id}
            variants={staggerItem}
            transition={transitionPresets.normal}
            className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
          >
            {/* 背景装飾 */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -top-8 -right-8 h-16 w-16 rounded-full bg-primary/5 blur-xl transition-all duration-300 group-hover:bg-primary/10" />
            
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <time 
                  dateTime={item.published_at}
                  className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {formatDate(item.published_at)}
                </time>
              </div>
              <h3 className="mb-3 text-base font-semibold text-foreground">{item.title}</h3>
              <div className="prose prose-sm max-w-none text-foreground [&>*]:text-foreground">
                <PageBody html={item.body_html} />
              </div>
            </div>
            
            {/* ホバー時のボーダーグロー効果 */}
            <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/20" />
          </motion.li>
        ))}
      </motion.ul>
      
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
        >
          もっと見る →
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <ModalMotion open={modalOpen}>
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
          </ModalMotion>
        </div>
      )}
    </section>
  );
}
