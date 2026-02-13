"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

type ExternalApiRefreshButtonProps = {
  adminPath: string;
};

export function ExternalApiRefreshButton({ adminPath }: ExternalApiRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleRefresh() {
    setRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/external-api/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "ok", text: "キャッシュを更新しました" });
        // ページをリロードして最新データを表示
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: typeof data.error === "string" ? data.error : "更新に失敗しました",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "更新に失敗しました",
      });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 md:text-sm"
      >
        <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "更新中..." : "今すぐ更新"}
      </button>
      {message && (
        <p
          className={
            message.type === "ok"
              ? "text-xs text-green-600 dark:text-green-400"
              : "text-xs text-destructive"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
