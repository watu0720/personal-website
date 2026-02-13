import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNewsList } from "./components/admin-news-list";

export default function AdminNewsPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-lg font-bold text-foreground md:text-xl">お知らせ管理</h1>
        <Link
          href="news/edit"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 md:text-sm"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Link>
      </div>

      <AdminNewsList />
    </div>
  );
}
