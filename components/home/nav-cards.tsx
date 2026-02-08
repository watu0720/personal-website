"use client";

import Link from "next/link";
import {
  User,
  Youtube,
  MonitorPlay,
  Github,
  ArrowRight,
} from "lucide-react";

const pages = [
  {
    label: "Profile",
    description: "自己紹介・スキル・リンク集",
    href: "/profile",
    icon: User,
    iconBg: "bg-primary",
  },
  {
    label: "YouTube",
    description: "YouTube投稿動画一覧",
    href: "/youtube",
    icon: Youtube,
    iconBg: "bg-red-600",
  },
  {
    label: "Niconico",
    description: "ニコニコ動画投稿一覧",
    href: "/niconico",
    icon: MonitorPlay,
    iconBg: "bg-neutral-800 dark:bg-neutral-300 dark:text-neutral-900",
  },
  {
    label: "Dev (GitHub)",
    description: "開発リポジトリ一覧",
    href: "/dev",
    icon: Github,
    iconBg: "bg-emerald-600",
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
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${p.iconBg} text-white`}
            >
              <p.icon className="h-5 w-5" />
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
