"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Image, MessageSquare, Flag, ScrollText, BarChart3, ListTodo, HardDrive, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "ダッシュボード", href: "", icon: LayoutDashboard },
  { label: "訪問者統計", href: "/stats", icon: BarChart3 },
  { label: "ページ編集", href: "/page-contents", icon: FileText },
  { label: "画像管理", href: "/images", icon: Image },
  { label: "コメント管理", href: "/comments", icon: MessageSquare },
  { label: "通報管理", href: "/reports", icon: Flag },
  { label: "操作ログ", href: "/audit-logs", icon: ScrollText },
  { label: "改訂履歴", href: "/changelog", icon: ListTodo },
  { label: "ストレージ整理", href: "/storage", icon: HardDrive },
] as const;

type AdminSidebarProps = {
  adminPath: string;
};

export function AdminSidebar({ adminPath }: AdminSidebarProps) {
  const pathname = usePathname();
  const base = `/${adminPath}`;

  return (
    <aside className="w-56 shrink-0 border-r bg-card p-4">
      <nav className="flex flex-col gap-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const path = href ? `${base}${href}` : base;
          const active =
            href === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          サイトを見る
        </a>
      </div>
    </aside>
  );
}
