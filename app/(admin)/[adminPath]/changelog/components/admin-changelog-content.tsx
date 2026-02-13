"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Edit2 } from "lucide-react";

// TinyMCEのHydrationエラーを防ぐため、SSRを無効化
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false }
);

type ChangelogRow = {
  id: string;
  title: string;
  body_html: string;
  published_at: string;
  created_at: string;
};

export function AdminChangelogContent() {
  const [list, setList] = useState<ChangelogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBodyHtml, setEditingBodyHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchList = async () => {
    const res = await fetch("/api/admin/changelog");
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);

  async function handleAdd() {
    const t = title.trim();
    if (!t || !bodyHtml.trim()) {
      setMessage({ type: "error", text: "タイトルと本文を入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, body_html: bodyHtml }),
      });
      const out = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: out?.error ?? "追加に失敗しました。" });
        return;
      }
      setMessage({ type: "ok", text: "追加しました。" });
      setTitle("");
      setBodyHtml("");
      fetchList();
    } catch {
      setMessage({ type: "error", text: "追加に失敗しました。" });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: ChangelogRow) {
    setEditingId(row.id);
    setEditingTitle(row.title);
    setEditingBodyHtml(row.body_html);
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
    setEditingBodyHtml("");
    setMessage(null);
  }

  async function handleUpdate() {
    if (!editingId) return;
    const t = editingTitle.trim();
    if (!t || !editingBodyHtml.trim()) {
      setMessage({ type: "error", text: "タイトルと本文を入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/changelog/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, body_html: editingBodyHtml }),
      });
      const out = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: out?.error ?? "更新に失敗しました。" });
        return;
      }
      setMessage({ type: "ok", text: "更新しました。" });
      setEditingId(null);
      setEditingTitle("");
      setEditingBodyHtml("");
      fetchList();
    } catch {
      setMessage({ type: "error", text: "更新に失敗しました。" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この改訂履歴を削除しますか？")) return;
    const res = await fetch(`/api/admin/changelog/${id}`, { method: "DELETE" });
    if (res.ok) fetchList();
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("ja-JP");
    } catch {
      return s;
    }
  };

  return (
    <>
      <div className="mb-6 rounded-xl border bg-card p-3 md:mb-8 md:p-4">
        <h2 className="mb-3 text-base font-semibold text-foreground md:text-lg">
          {editingId ? "編集" : "新規追加"}
        </h2>
        <input
          type="text"
          placeholder="タイトル"
          value={editingId ? editingTitle : title}
          onChange={(e) => (editingId ? setEditingTitle(e.target.value) : setTitle(e.target.value))}
          className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground md:text-sm"
        />
        <RichTextEditor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? ""}
          value={editingId ? editingBodyHtml : bodyHtml}
          onChange={editingId ? setEditingBodyHtml : setBodyHtml}
        />
        {message && (
          <p className={`mt-2 text-xs md:text-sm ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          {editingId ? (
            <>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 md:text-sm"
              >
                {saving ? "更新中..." : "更新"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg border border-input bg-background px-4 py-2 text-xs md:text-sm"
              >
                キャンセル
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 md:w-auto md:text-sm"
            >
              {saving ? "追加中..." : "追加"}
            </button>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-base font-semibold text-foreground md:text-lg">一覧</h2>
      {loading ? (
        <p className="text-xs text-muted-foreground md:text-sm">読み込み中...</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-muted-foreground md:text-sm">まだありません。</p>
      ) : (
        <ul className="space-y-2 md:space-y-3">
          {list.map((row) => (
            <li key={row.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between md:p-4">
              <div>
                <span className="text-sm font-medium text-foreground md:text-base">{row.title}</span>
                <span className="ml-2 text-[10px] text-muted-foreground md:text-xs">{formatDate(row.published_at)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  disabled={editingId !== null}
                  className="flex items-center gap-1 rounded border border-input bg-background px-3 py-1 text-xs hover:bg-muted disabled:opacity-50 md:text-sm"
                  title="編集"
                >
                  <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  disabled={editingId !== null}
                  className="rounded border border-destructive/50 px-3 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50 md:text-sm"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
