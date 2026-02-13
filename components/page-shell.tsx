"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PageTransition } from "@/components/page-transition";

interface PageShellProps {
  children: React.ReactNode;
  /** ホーム用ヘッダー画像URL（ヘッダー内で pathname === '/' のときのみ表示） */
  headerImageUrl?: string | null;
}

export function PageShell({ children, headerImageUrl }: PageShellProps) {
  const pathname = usePathname();
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    // 404ページかどうかを判定（DOM要素をチェック）
    const checkNotFound = () => {
      const notFoundElement = document.querySelector(".not-found-page");
      setIsNotFound(!!notFoundElement);
    };

    // 初回チェック（少し遅延させてDOMがレンダリングされるのを待つ）
    const timer = setTimeout(checkNotFound, 100);

    // MutationObserverでDOMの変更を監視
    const observer = new MutationObserver(checkNotFound);
    if (typeof document !== "undefined") {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  // 404ページの場合はヘッダーとフッターを表示しない
  if (isNotFound) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader heroImageUrl={headerImageUrl} />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
