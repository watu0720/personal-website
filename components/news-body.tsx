"use client";

import { useEffect, useRef } from "react";
import { sanitizeRichText } from "@/lib/sanitize";
import { extractLinksFromHtml } from "@/lib/services/link-preview";
import { LinkPreviewCard } from "@/components/link-preview-card";
import { SearchHighlightContainer } from "@/components/search-highlight";
import { useSearchParams } from "next/navigation";

type NewsBodyProps = {
  html: string;
  className?: string;
};

/**
 * お知らせ本文を表示し、リンクの直下にリンクプレビューカードを挿入
 */
export function NewsBody({ html, className = "" }: NewsBodyProps) {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const query = rawQuery.trim() || undefined;
  const mode =
    (searchParams.get("mode") === "word" ? "word" : "partial") as "partial" | "word";

  const sanitized = sanitizeRichText(html);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // リンクを抽出
    const links = extractLinksFromHtml(sanitized);
    const uniqueLinks = [...new Set(links)];

    // 各リンクの直下にプレビューカードを挿入
    uniqueLinks.forEach((url) => {
      const linkElements = containerRef.current?.querySelectorAll(`a[href="${url}"]`);
      linkElements?.forEach((linkEl) => {
        // 既にプレビューが挿入されているかチェック
        const nextSibling = linkEl.nextSibling;
        if (
          nextSibling &&
          nextSibling.nodeType === Node.ELEMENT_NODE &&
          (nextSibling as Element).classList.contains("link-preview-wrapper")
        ) {
          return; // 既に挿入済み
        }

        // プレビューカードのラッパーを作成
        const wrapper = document.createElement("div");
        wrapper.className = "link-preview-wrapper";
        wrapper.setAttribute("data-url", url);

        // Reactコンポーネントをレンダリングするためのコンテナ
        const previewContainer = document.createElement("div");
        wrapper.appendChild(previewContainer);

        // リンクの直後に挿入
        linkEl.parentNode?.insertBefore(wrapper, linkEl.nextSibling);

        // Reactコンポーネントをレンダリング（簡易版：直接DOM操作）
        // 実際には、より高度な方法が必要ですが、ここでは簡易実装
      });
    });
  }, [sanitized]);

  return (
    <div
      ref={containerRef}
      className={`[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-0.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 ${className}`}
    >
      <SearchHighlightContainer query={query} mode={mode}>
        <div
          className="[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm [&_pre]:font-mono [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      </SearchHighlightContainer>
      {/* リンクプレビューを表示 */}
      {extractLinksFromHtml(sanitized)
        .filter((url, idx, arr) => arr.indexOf(url) === idx) // 重複除去
        .map((url) => (
          <LinkPreviewCard key={url} url={url} />
        ))}
    </div>
  );
}
