import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { AlertTriangle, Flag, MessageSquare, HardDrive, AlertCircle } from "lucide-react";
import { ExternalApiRefreshButton } from "@/components/admin/external-api-refresh-button";

export const metadata: Metadata = {
  title: "管理画面 | わっつーのHP",
  description: "管理者用ダッシュボード",
};

export default async function AdminDashboardPage(props: { params: Promise<{ adminPath: string }> }) {
  const { adminPath } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();
  if (!adminRow) return null;

  const admin = createServiceRoleClient();

  // 未確認通報（新着）
  const { data: unreported } = await admin
    .from("comment_reports")
    .select("id")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(10);

  // 自動非表示中コメント（復活可能）
  const { data: autoHidden } = await admin
    .from("comments")
    .select("id, page_key, body, created_at")
    .eq("is_hidden", true)
    .eq("hidden_reason", "reported")
    .order("created_at", { ascending: false })
    .limit(10);

  // ストレージ警告（簡易版：使用率80%以上で警告）
  let storageWarning = false;
  let storagePercent = 0;
  try {
    const bucket = "public-assets";
    const { data: list } = await admin.storage.from(bucket).list("", { limit: 1000 });
    let usedBytes = 0;
    for (const item of list ?? []) {
      const size = Number((item as { metadata?: { size?: number } }).metadata?.size);
      if (typeof size === "number" && size > 0) {
        usedBytes += size;
      }
    }
    const limitBytes = 1024 * 1024 * 1024; // 1GB
    storagePercent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;
    storageWarning = storagePercent >= 80;
  } catch {
    // ignore
  }

  // 外部APIエラー履歴（簡易版：external_cacheの古いエントリを確認）
  const { data: oldCache } = await admin
    .from("external_cache")
    .select("id, provider, fetched_at")
    .lt("fetched_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("fetched_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">未処理ダッシュボード</h1>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {/* 未確認通報 */}
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <div className="mb-2 flex items-center gap-2 md:mb-3">
            <Flag className="h-4 w-4 text-primary md:h-5 md:w-5" />
            <h2 className="text-sm font-semibold text-foreground md:text-base">未確認通報</h2>
            {unreported && unreported.length > 0 && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary md:px-2 md:text-xs">
                {unreported.length}件
              </span>
            )}
          </div>
          {unreported && unreported.length > 0 ? (
            <Link
              href={`/${adminPath}/reports?resolved=false`}
              className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 md:text-sm"
            >
              通報管理で確認する →
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground md:text-sm">未確認の通報はありません</p>
          )}
        </div>

        {/* 自動非表示中コメント */}
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <div className="mb-2 flex items-center gap-2 md:mb-3">
            <MessageSquare className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
            <h2 className="text-sm font-semibold text-foreground md:text-base">自動非表示中コメント</h2>
            {autoHidden && autoHidden.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 md:px-2 md:text-xs">
                {autoHidden.length}件
              </span>
            )}
          </div>
          {autoHidden && autoHidden.length > 0 ? (
            <div className="space-y-2">
              <Link
                href={`/${adminPath}/comments?state=reported`}
                className="block text-xs text-primary underline underline-offset-2 hover:text-primary/80 md:text-sm"
              >
                コメント管理で確認する →
              </Link>
              <p className="text-[10px] text-muted-foreground md:text-xs">
                最新: {autoHidden[0]?.body.slice(0, 50)}…
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground md:text-sm">自動非表示中のコメントはありません</p>
          )}
        </div>

        {/* ストレージ警告 */}
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <div className="mb-2 flex items-center gap-2 md:mb-3">
            <HardDrive className="h-4 w-4 text-orange-500 md:h-5 md:w-5" />
            <h2 className="text-sm font-semibold text-foreground md:text-base">ストレージ使用状況</h2>
          </div>
          {storageWarning ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 md:text-sm">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium">警告：使用率が{storagePercent}%です</span>
              </div>
              <Link
                href={`/${process.env.ADMIN_PATH_SECRET || "admin"}/storage`}
                className="block text-xs text-primary underline underline-offset-2 hover:text-primary/80 md:text-sm"
              >
                ストレージ整理で確認する →
              </Link>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground md:text-sm">
              {storagePercent > 0 ? `ストレージ使用率: ${storagePercent}%` : "ストレージ使用状況は正常です"}
            </p>
          )}
        </div>

        {/* 外部APIキャッシュ更新 */}
        <div className="rounded-lg border bg-card p-3 md:p-4">
          <div className="mb-2 flex items-center gap-2 md:mb-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
            <h2 className="text-sm font-semibold text-foreground md:text-base">外部APIキャッシュ更新</h2>
          </div>
          <ExternalApiRefreshButton adminPath={adminPath} />
          {oldCache && oldCache.length > 0 && (
            <div className="mt-2 space-y-1 text-[10px] text-muted-foreground md:text-xs">
              <p>24時間以上更新されていないキャッシュ: {oldCache.length}件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
