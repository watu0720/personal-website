"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * ルート変更時にメインコンテンツを短いフェードで表示（設計書 Phase 1.2）
 * ページ遷移中はローディングインジケーターを表示
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // pathnameが変更されたらローディングを解除
    if (pathname !== prevPathnameRef.current) {
      // 既存のタイマーをクリア
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      // ローディングを解除
      setIsLoading(false);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  // リンククリックを監視
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (target.href && target.href.startsWith(window.location.origin) && !target.href.includes("#")) {
        setIsLoading(true);
        // タイマーをクリア
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        // 最大2秒後にローディングを解除（フォールバック）
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      link.addEventListener("click", handleLinkClick);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", handleLinkClick);
      });
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary md:h-10 md:w-10" />
            <p className="text-sm text-muted-foreground md:text-base">読み込み中...</p>
          </div>
        </div>
      )}
      <motion.div
        key={`${pathname}-${searchParams.toString()}`}
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.03 }}
      >
        {children}
      </motion.div>
    </>
  );
}
