"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Sun, Moon, Menu, X } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { AuthStatus } from "@/components/auth-status";
import { GoogleIcon } from "@/components/ui/google-icon";
import { NavIcons } from "@/components/ui/nav-icons";
import { SearchModal } from "@/components/search-modal";

const NAV = [
  { label: "ホーム", href: "/", icon: "Home" as const },
  { label: "プロフィール", href: "/profile", icon: "User" as const },
  { label: "YouTube", href: "/youtube", icon: "Youtube" as const },
  { label: "ニコニコ", href: "/niconico", icon: "niconico" as const },
  { label: "開発", href: "/dev", icon: "github" as const },
  { label: "お知らせ", href: "/news", icon: "Newspaper" as const },
];

const NAV_IMAGE_ICONS: Record<string, string> = {
  niconico: "/icons/niconico.png",
  github: "/icons/github.png",
};

interface SiteHeaderProps {
  /** ホーム用ヘッダー画像URL。pathname === '/' のときのみ表示 */
  heroImageUrl?: string | null;
}

export function SiteHeader({ heroImageUrl }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const showHeroImage = pathname === "/" && !!heroImageUrl;
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]); // Hydrationエラー回避のため、初期値は空配列

  const RECENT_KEY = "recent_search_words";

  // クライアント側でのみlocalStorageから読み込む（Hydrationエラー回避）
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as string[];
      if (Array.isArray(arr)) {
        setRecentSearches(arr);
      }
    } catch {
      // ignore
    }
  }, []);

  function saveRecent(q: string) {
    if (typeof window === "undefined") return;
    try {
      const current = recentSearches.filter((w) => w !== q);
      const next = [q, ...current].slice(0, 10);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecentSearches(next); // stateも更新
    } catch {
      // ignore
    }
  }

  const handleSearchSubmit = () => {
    const q = search.trim();
    if (!q) return;
    const params = new URLSearchParams({ q, mode: "partial" });
    // 現在のURLからtypesパラメータを取得して維持
    if (typeof window !== "undefined") {
      const currentParams = new URLSearchParams(window.location.search);
      const types = currentParams.get("types");
      if (types) {
        params.set("types", types);
      }
    }
    saveRecent(q);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      {/* 常に表示する sticky ヘッダー（わっつーのHP ＋ Top Bar ＋ Nav Bar） */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        {/* ヘッダー本体（オーバーレイより前面に表示） */}
        <div className="relative z-[60]">
          {/* 装飾的なカラーバー */}
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
          
          {/* Top Bar（上段） */}
          <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between gap-3 flex-nowrap">
            {/* 左: ブランド領域 */}
            <div className="min-w-0 shrink flex items-center gap-2">
              <Link href="/" className="shrink-0 text-lg font-bold text-foreground hover:text-primary transition-colors">
                わっつーのHP
              </Link>
            </div>

            {/* 右: アクション領域 */}
            <div className="shrink-0 flex items-center gap-2">
              {/* 検索（md以上：インライン、md未満：アイコン） */}
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="サイト内検索"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSubmit();
                    }}
                    onFocus={(e) => {
                      if (recentSearches.length === 0) return;
                      const list = document.getElementById("recent-search-list");
                      if (list) list.classList.remove("hidden");
                    }}
                    onBlur={() => {
                      const list = document.getElementById("recent-search-list");
                      if (list) {
                        // 少し遅らせてクリックを拾えるようにする
                        setTimeout(() => list.classList.add("hidden"), 100);
                      }
                    }}
                    className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div
                    id="recent-search-list"
                    className="absolute left-0 right-0 top-full z-20 mt-1 hidden rounded-lg border bg-card py-1 text-xs shadow-lg"
                  >
                    {recentSearches.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearch(word);
                        }}
                        className="flex w-full items-center px-3 py-1 text-left text-muted-foreground hover:bg-muted"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  disabled={!search.trim()}
                  className="btn-motion shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  検索
                </button>
              </div>
              
              {/* 検索アイコン（md未満） */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="検索"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* テーマ切替 */}
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="テーマ切替"
              >
                <Sun className="hidden h-4 w-4 dark:block" />
                <Moon className="block h-4 w-4 dark:hidden" />
              </button>

              {/* Google アイコン */}
              <span className="shrink-0" aria-hidden>
                <GoogleIcon className="h-5 w-5" />
              </span>

              {/* 認証状態 */}
              <div className="shrink-0">
                <AuthStatus compact />
              </div>

              {/* レスポンシブ：ナビメニューボタン */}
              <button
                type="button"
                onClick={() => setNavMenuOpen((o) => !o)}
                className="md:hidden shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={navMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              >
                {navMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Nav Bar（下段）※ md以上で表示 */}
        <nav className="hidden border-t border-border bg-muted/80 md:block" aria-label="メイン">
          <div className="mx-auto max-w-6xl px-2">
            <div className="grid h-[72px] grid-cols-6">
              {NAV.map((item) => {
                const active = item.href === "/news" 
                  ? pathname === "/news" || pathname.startsWith("/news/")
                  : pathname === item.href;
                const imageSrc = NAV_IMAGE_ICONS[item.icon];
                const IconComponent = imageSrc ? null : NavIcons[item.icon as keyof typeof NavIcons];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`btn-motion flex flex-col items-center justify-center gap-1 rounded-md transition-colors ${
                      active
                        ? "bg-card text-primary shadow-sm border-b-2 border-primary"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    }`}
                  >
                    {imageSrc ? (
                      <span className="relative h-6 w-6 shrink-0">
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="24px"
                        />
                      </span>
                    ) : IconComponent ? (
                      <IconComponent className="h-6 w-6" />
                    ) : null}
                    <span className="text-xs font-medium hidden sm:block">{item.label}</span>
                    <span className="text-xs font-medium sm:hidden">
                      {item.label === "プロフィール" ? "プロフ" : 
                       item.label === "ニコニコ" ? "ニコ" : 
                       item.label === "お知らせ" ? "お知" :
                       item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        </div>

        {/* レスポンシブ：オーバーレイメニュー（md未満） */}
        <AnimatePresence>
          {navMenuOpen && (
            <motion.div
              className="fixed inset-0 z-40 md:hidden"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* 背景：ヘッダーは暗くしない（top-[4.25rem]で直下から）、クリックで閉じる */}
              <motion.div
                className="absolute left-0 right-0 bottom-0 top-[4.25rem] bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setNavMenuOpen(false)}
                aria-hidden
              />
              {/* メニューパネル：ヘッダー直下からスライド（被り防止） */}
              <motion.nav
                className="absolute left-0 right-0 top-[4.25rem] rounded-b-2xl border-b border-border bg-card shadow-xl"
                initial={{ opacity: 0, y: "-100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-100%" }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                onClick={(e) => e.stopPropagation()}
                aria-label="メイン（メニュー）"
              >
                <div className="px-4 pb-6 pt-4">
                  <ul className="flex flex-col gap-0.5">
                    {NAV.map((item, i) => {
                      const active = item.href === "/news" 
                        ? pathname === "/news" || pathname.startsWith("/news/")
                        : pathname === item.href;
                      const imageSrc = NAV_IMAGE_ICONS[item.icon];
                      const IconComponent = imageSrc ? null : NavIcons[item.icon as keyof typeof NavIcons];
                      return (
                        <li key={item.href}>
                          <motion.span
                            className="block"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.2 }}
                          >
                            <Link
                            href={item.href}
                            onClick={() => setNavMenuOpen(false)}
                            className={`btn-motion flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {imageSrc ? (
                              <span className="relative h-5 w-5 shrink-0">
                                <Image
                                  src={imageSrc}
                                  alt=""
                                  fill
                                  className="object-contain"
                                  sizes="20px"
                                />
                              </span>
                            ) : IconComponent ? (
                              <IconComponent className="h-5 w-5 shrink-0" />
                            ) : null}
                            {item.label}
                          </Link>
                          </motion.span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ホーム画面のみ：ヘッダー画像（sticky ではないのでスクロールで隠れる） */}
      {showHeroImage && heroImageUrl && (
        <div className="relative h-56 w-full sm:h-72 md:h-80 overflow-hidden">
          <Image
            src={heroImageUrl}
            alt="ヘッダー"
            fill
            className="object-cover"
            priority
            unoptimized={heroImageUrl.startsWith("http")}
          />
          {/* グラデーションオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* 装飾的な要素 */}
          <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-primary/20 blur-xl" />
          <div className="absolute bottom-6 left-6 h-12 w-12 rounded-full bg-accent/30 blur-lg" />
          
          {/* ヘッダー画像上のタイトル */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-8 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
              <div className="mx-auto max-w-6xl">
                <h1 className="mb-3 text-3xl md:text-4xl font-bold text-white text-balance bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  わっつーのHP へようこそ
                </h1>
                <p className="text-base leading-relaxed text-white/90 max-w-2xl">
                  動画投稿・開発活動などをまとめた個人ホームページです。
                </p>
                <div className="mt-6 h-1 w-24 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 検索モーダル */}
      <SearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
    </>
  );
}
