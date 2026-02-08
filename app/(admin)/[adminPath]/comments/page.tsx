"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, Eye, EyeOff, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "home", label: "Home" },
  { value: "profile", label: "Profile" },
  { value: "youtube", label: "YouTube" },
  { value: "niconico", label: "Niconico" },
  { value: "dev", label: "Dev" },
];
const STATE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "visible", label: "表示" },
  { value: "hidden", label: "非表示" },
  { value: "reported", label: "自動非表示" },
  { value: "deleted", label: "削除済" },
];

type CommentRow = {
  id: string;
  page_key: string;
  author_type: string;
  guest_name: string | null;
  body: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  admin_heart: boolean;
  created_at: string;
  good_count: number;
  not_good_count: number;
  report_count: number;
};

export default function AdminCommentsPage() {
  const supabase = createClient();
  const [list, setList] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageKey, setPageKey] = useState("");
  const [state, setState] = useState("");
  const [authorType, setAuthorType] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (pageKey) params.set("page_key", pageKey);
    if (state) params.set("state", state);
    if (authorType) params.set("author_type", authorType);
    const res = await fetch(`/api/admin/comments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setList(data);
    setLoading(false);
  }, [supabase.auth, pageKey, state, authorType]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function doAction(commentId: string, action: "hide" | "unhide" | "delete") {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    await fetch(`/api/admin/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    fetchList();
  }

  async function toggleHeart(commentId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    await fetch(`/api/admin/comments/${commentId}/heart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchList();
  }

  const stateBadge = (c: CommentRow) => {
    if (!c.is_hidden) return <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs dark:bg-green-900/40">表示</span>;
    if (c.hidden_reason === "reported") return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/40">⚠ 自動非表示</span>;
    if (c.hidden_reason === "admin") return <span className="rounded bg-muted px-1.5 py-0.5 text-xs">非表示</span>;
    if (c.hidden_reason === "deleted") return <span className="rounded bg-muted px-1.5 py-0.5 text-xs">削除済</span>;
    return null;
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold text-foreground">コメント管理</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={pageKey} onChange={(e) => setPageKey(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          {PAGE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          {STATE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={authorType} onChange={(e) => setAuthorType(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="">すべて</option>
          <option value="user">ログイン</option>
          <option value="guest">ゲスト</option>
        </select>
      </div>
      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">日時</th>
                <th className="px-4 py-2 text-left">ページ</th>
                <th className="px-4 py-2 text-left">投稿者</th>
                <th className="px-4 py-2 text-left">本文</th>
                <th className="px-4 py-2 text-left">Good</th>
                <th className="px-4 py-2 text-left">NotGood</th>
                <th className="px-4 py-2 text-left">通報</th>
                <th className="px-4 py-2 text-left">状態</th>
                <th className="px-4 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">{new Date(c.created_at).toLocaleString("ja")}</td>
                  <td className="px-4 py-2">{c.page_key}</td>
                  <td className="px-4 py-2">{c.author_type === "guest" ? (c.guest_name || "—") : "ユーザー"}</td>
                  <td className="max-w-xs truncate px-4 py-2">{c.body}</td>
                  <td className="px-4 py-2">{c.good_count}</td>
                  <td className="px-4 py-2">{c.not_good_count}</td>
                  <td className="px-4 py-2">{c.report_count}</td>
                  <td className="px-4 py-2">{stateBadge(c)}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {c.is_hidden ? (
                        <button type="button" onClick={() => doAction(c.id, "unhide")} className="rounded p-1 hover:bg-muted" title="復活">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => doAction(c.id, "hide")} className="rounded p-1 hover:bg-muted" title="非表示">
                          <EyeOff className="h-4 w-4" />
                        </button>
                      )}
                      {c.hidden_reason !== "deleted" && (
                        <button type="button" onClick={() => doAction(c.id, "delete")} className="rounded p-1 hover:bg-destructive/20" title="削除">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button type="button" onClick={() => toggleHeart(c.id)} className={cn("rounded p-1", c.admin_heart && "text-primary")} title="管理者ハート">
                        <Heart className={c.admin_heart ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && list.length === 0 && <p className="mt-4 text-muted-foreground">該当するコメントはありません。</p>}
    </div>
  );
}
