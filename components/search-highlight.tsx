"use client";

import { useEffect, useRef } from "react";
import Mark from "mark.js";

type Props = {
  query?: string;
  mode?: "partial" | "word";
  children: React.ReactNode;
};

/**
 * HTML を壊さない形でテキストハイライトするコンテナ。
 * - 内部の DOM に対して mark.js を適用
 * - サニタイズ済み HTML（PageBody など）のラッパーとして使用
 */
export function SearchHighlightContainer({ query, mode = "partial", children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = new Mark(ref.current);
    instance.unmark();

    const q = query?.trim();
    if (!q) return;

    const isAsciiWord = /^[A-Za-z0-9]+$/.test(q);

    if (mode === "word" && isAsciiWord) {
      instance.mark(q, {
        separateWordSearch: false,
        accuracy: "exactly",
      });
    } else {
      instance.mark(q, {
        separateWordSearch: false,
        accuracy: "partially",
      });
    }
  }, [query, mode]);

  return <div ref={ref}>{children}</div>;
}

