"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type ApiKeyStatus = {
  name: string;
  envVar: string;
  configured: boolean;
  description: string;
};

export default function AdminApiKeysPage() {
  const supabase = createClient();
  const [statuses, setStatuses] = useState<ApiKeyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/api-keys/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStatuses(data);
      }
      setLoading(false);
    })();
  }, [supabase.auth]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl">APIキー管理</h1>
      <p className="mb-4 text-xs text-muted-foreground md:text-sm">
        実キーはVercel環境変数で管理されています。ここでは設定状況のみ確認できます。
      </p>
      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {statuses.map((status) => (
            <div key={status.envVar} className="rounded-lg border bg-card p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                {status.configured ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 md:h-5 md:w-5" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground md:text-base">{status.name}</h3>
                  <p className="text-[10px] text-muted-foreground md:text-xs">{status.description}</p>
                  <p className="mt-1 truncate text-[10px] font-mono text-muted-foreground md:text-xs">{status.envVar}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium md:px-2 md:py-1 md:text-xs ${
                    status.configured
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {status.configured ? "設定済み" : "未設定"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && statuses.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20 md:p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
            <p className="text-xs font-medium md:text-sm">APIキーの状態を取得できませんでした</p>
          </div>
        </div>
      )}
    </div>
  );
}
