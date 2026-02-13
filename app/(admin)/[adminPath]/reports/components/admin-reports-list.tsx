"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";

type ReportRow = {
  id: string;
  comment_id: string;
  reason: string;
  message: string | null;
  resolved: boolean;
  created_at: string;
  comments: { page_key: string; body: string; is_hidden: boolean; hidden_reason: string | null } | null;
};

const REASON_LABEL: Record<string, string> = { spam: "スパム", abuse: "誹謗", other: "その他" };

export function AdminReportsList() {
  const params = useParams<{ adminPath: string }>();
  const supabase = createClient();
  const [list, setList] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedFilter, setResolvedFilter] = useState("false");

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (resolvedFilter) params.set("resolved", resolvedFilter);
    const res = await fetch(`/api/admin/reports?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setList(data);
    setLoading(false);
  }, [supabase.auth, resolvedFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function setResolved(reportId: string, resolved: boolean) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resolved }),
    });
    fetchList();
  }

  const base = `/${params.adminPath}/comments`;

  return (
    <>
      <p className="mb-2 text-xs text-muted-foreground md:text-sm">
        ここでの「対応済」は、管理者が通報内容を確認し終えたかどうかを示すステータスです。
        コメントの表示・非表示や自動非表示（通報合計3件以上）の挙動には直接影響しません。
      </p>
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="resolvedFilter">
          表示する通報のステータス
        </label>
        <select
          id="resolvedFilter"
          value={resolvedFilter}
          onChange={(e) => setResolvedFilter(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-xs md:w-auto md:text-sm"
        >
          <option value="false">未対応</option>
          <option value="true">対応済</option>
          <option value="">すべて</option>
        </select>
      </div>
      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {list.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-3 md:p-4">
              <div className="mb-2 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <span className="text-xs text-muted-foreground md:text-sm">{new Date(r.created_at).toLocaleString("ja")}</span>
                {r.resolved ? (
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] md:text-xs">対応済</span>
                ) : (
                  <button type="button" onClick={() => setResolved(r.id, true)} className="rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground hover:bg-primary/90 md:text-xs">対応済にする</button>
                )}
              </div>
              <p className="text-xs md:text-sm"><strong>理由:</strong> {REASON_LABEL[r.reason] ?? r.reason}</p>
              {r.message && <p className="mt-1 text-xs text-muted-foreground md:text-sm">{r.message}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground md:text-xs">comment_id: {r.comment_id}</p>
              {r.comments && (
                <p className="mt-2 truncate text-xs md:text-sm">対象: [{r.comments.page_key}] {r.comments.body.slice(0, 80)}…</p>
              )}
              <Link href={`${base}?highlight=${r.comment_id}`} className="mt-2 inline-block text-xs text-primary hover:underline md:text-sm">コメント管理で対象を表示</Link>
            </div>
          ))}
        </div>
      )}
      {!loading && list.length === 0 && <p className="text-muted-foreground">該当する通報はありません。</p>}
    </>
  );
}
