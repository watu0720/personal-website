"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type AuditRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export default function AdminAuditLogsPage() {
  const supabase = createClient();
  const [list, setList] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setList(data);
    setLoading(false);
  }, [supabase.auth, actionFilter, from, to]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold text-foreground">操作ログ</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="">action: すべて</option>
          <option value="page.update">page.update</option>
          <option value="asset.update">asset.update</option>
          <option value="comment.hide">comment.hide</option>
          <option value="comment.unhide">comment.unhide</option>
          <option value="comment.delete">comment.delete</option>
          <option value="comment.heart">comment.heart</option>
        </select>
        <button type="button" onClick={() => fetchList()} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">再取得</button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">日時</th>
                <th className="px-4 py-2 text-left">管理者</th>
                <th className="px-4 py-2 text-left">action</th>
                <th className="px-4 py-2 text-left">target_type</th>
                <th className="px-4 py-2 text-left">target_id</th>
                <th className="px-4 py-2 text-left">meta</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">{new Date(row.created_at).toLocaleString("ja")}</td>
                  <td className="px-4 py-2">{row.actor_user_id?.slice(0, 8) ?? "—"}…</td>
                  <td className="px-4 py-2">{row.action}</td>
                  <td className="px-4 py-2">{row.target_type}</td>
                  <td className="px-4 py-2">{row.target_id}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-muted-foreground">{JSON.stringify(row.meta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && list.length === 0 && <p className="mt-4 text-muted-foreground">該当するログはありません。</p>}
    </div>
  );
}
