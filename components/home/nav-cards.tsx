"use client";

import Link from "next/link";
import { User, ArrowRight, Newspaper } from "lucide-react";
import { ServiceIcon } from "@/components/ui/service-icon";

const pages = [
  {
    label: "プロフィール",
    description: "自己紹介・スキル・リンク集",
    href: "/profile",
    iconKind: "user" as const,
    iconBg: "bg-primary",
  },
  {
    label: "YouTube",
    description: "YouTube投稿動画一覧",
    href: "/youtube",
    iconKind: "youtube" as const,
    iconBg: null,
  },
  {
    label: "ニコニコ",
    description: "ニコニコ動画投稿一覧",
    href: "/niconico",
    iconKind: "niconico" as const,
    iconBg: null,
  },
  {
    label: "開発",
    description: "開発リポジトリ一覧",
    href: "/dev",
    iconKind: "github" as const,
    iconBg: null,
  },
  {
    label: "お知らせ",
    description: "最新のお知らせや更新情報",
    href: "/news",
    iconKind: "newspaper" as const,
    iconBg: null,
  },
];

export function HomeNavCards() {
  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground">ページ一覧</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {pages.map((p, index) => (
          <Link
            key={p.href}
            href={p.href}
            className="group btn-motion relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/80 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
          >
            {/* 背景装飾 */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  p.iconBg 
                    ? `${p.iconBg} text-white group-hover:scale-110 group-hover:shadow-lg` 
                    : "bg-muted group-hover:bg-primary/10 group-hover:scale-110"
                }`}
              >
                {p.iconKind === "user" ? (
                  <User className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                ) : p.iconKind === "newspaper" ? (
                  <Newspaper className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center [&>img]:h-7 [&>img]:w-7 transition-transform duration-300 group-hover:scale-110">
                    <ServiceIcon type={p.iconKind} size={28} />
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-1">
                  {p.label}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            </div>
            
            {/* ホバー時のボーダーグロー効果 */}
            <div className="absolute inset-0 rounded-2xl border border-primary/0 transition-all duration-300 group-hover:border-primary/30" />
          </Link>
        ))}
      </div>
    </section>
  );
}
