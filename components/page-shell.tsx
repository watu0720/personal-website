import React from "react";
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
