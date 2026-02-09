"use client";

import Link from "next/link";
import { User, ArrowRight } from "lucide-react";
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
];

export function HomeNavCards() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-foreground">ページ一覧</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {pages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${p.iconBg ?? ""} ${p.iconBg ? "text-white" : ""}`}
            >
              {p.iconKind === "user" ? (
                <User className="h-5 w-5" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center [&>img]:h-6 [&>img]:w-6">
                  <ServiceIcon type={p.iconKind} size={24} />
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                {p.label}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
