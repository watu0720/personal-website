import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理画面 | わっつーのHP",
  description: "管理者用ダッシュボード",
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Admin ダッシュボード（仮）
      </h1>
      <p className="text-muted-foreground">
        この先で管理機能（ページ編集・画像アップロード・コメント管理など）を実装します。
      </p>
    </div>
  );
}
