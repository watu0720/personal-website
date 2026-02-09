"use client";

import { useState, useEffect } from "react";
import { HardDrive, Trash2, AlertTriangle, Loader2 } from "lucide-react";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminStoragePage() {
  const [usage, setUsage] = useState<{ usedBytes: number; limitBytes: number; percent: number } | null>(null);
  const [auditBefore, setAuditBefore] = useState("");
  const [preview, setPreview] = useState<{ orphanPaths: string[]; auditLogsCount: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{
    orphansDeleted: number;
    auditLogsDeleted: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/storage/usage")
      .then((r) => r.json())
      .then((d) => setUsage(d))
      .catch(() => {});
  }, []);

  function loadPreview() {
    setLoadingPreview(true);
    setPreview(null);
    const params = new URLSearchParams();
    if (auditBefore) params.set("auditBefore", auditBefore);
    fetch(`/api/admin/storage/cleanup-preview?${params}`)
      .then((r) => r.json())
      .then((d) => setPreview(d))
      .catch(() => setPreview({ orphanPaths: [], auditLogsCount: 0 }))
      .finally(() => setLoadingPreview(false));
  }

  function runCleanup() {
    if (!preview) return;
    setExecuting(true);
    setResult(null);
    const body: { deleteOrphans?: string[]; deleteAuditLogsBefore?: string } = {};
    if (preview.orphanPaths.length > 0) body.deleteOrphans = preview.orphanPaths;
    if (auditBefore && preview.auditLogsCount > 0) body.deleteAuditLogsBefore = auditBefore;
    fetch("/api/admin/storage/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((d) => setResult(d))
      .catch((e) => setResult({ orphansDeleted: 0, auditLogsDeleted: 0, errors: [String(e)] }))
      .finally(() => setExecuting(false));
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
        <HardDrive className="h-5 w-5" />
        ストレージ整理
      </h1>

      {usage != null && (
        <section className="mb-8 rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">使用量</h2>
          <p className="text-foreground">
            {formatBytes(usage.usedBytes)} / {formatBytes(usage.limitBytes)} （{usage.percent}%）
          </p>
        </section>
      )}

      <section className="mb-8 rounded-xl border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-foreground">プレビュー</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          未参照の画像（DBで参照されていないストレージ内ファイル）と、指定日以前の操作ログを確認できます。
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">
            この日付より前の操作ログを削除対象に含める:
            <input
              type="date"
              value={auditBefore}
              onChange={(e) => setAuditBefore(e.target.value)}
              className="ml-2 rounded border bg-background px-2 py-1 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={loadPreview}
            disabled={loadingPreview}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            プレビューを取得
          </button>
        </div>

        {preview && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              未参照画像: <strong>{preview.orphanPaths.length}</strong> 件
            </p>
            {preview.orphanPaths.length > 0 && (
              <ul className="max-h-48 overflow-auto rounded border bg-muted/30 p-2 text-xs">
                {preview.orphanPaths.slice(0, 50).map((path) => (
                  <li key={path} className="truncate">
                    {path}
                  </li>
                ))}
                {preview.orphanPaths.length > 50 && (
                  <li className="text-muted-foreground">… 他 {preview.orphanPaths.length - 50} 件</li>
                )}
              </ul>
            )}
            {auditBefore && (
              <p className="text-sm text-foreground">
                {auditBefore} より前の操作ログ: <strong>{preview.auditLogsCount}</strong> 件
              </p>
            )}
            {(preview.orphanPaths.length > 0 || (auditBefore && preview.auditLogsCount > 0)) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  上記を削除すると元に戻せません。実行する場合は「削除を実行」を押してください。
                </span>
              </div>
            )}
            {(preview.orphanPaths.length > 0 || (auditBefore && preview.auditLogsCount > 0)) && (
              <button
                type="button"
                onClick={runCleanup}
                disabled={executing}
                className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
              >
                {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                削除を実行
              </button>
            )}
          </div>
        )}
      </section>

      {result && (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-foreground">実行結果</h2>
          <p className="text-sm text-foreground">
            未参照画像: {result.orphansDeleted} 件削除 · 操作ログ: {result.auditLogsDeleted} 件削除
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-sm text-destructive">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
