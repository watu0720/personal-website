"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type ChangelogRow = {
  id: string;
  title: string;
  body_html: string;
  published_at: string;
  created_at: string;
};

export default function AdminChangelogPage() {
  const [list, setList] = useState<ChangelogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">改訂履歴</h1>

      <div className="mb-8 rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">新規追加</h2>
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-foreground"
        />
        <RichTextEditor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? ""}
          value={bodyHtml}
          onChange={setBodyHtml}
        />
        {message && (
          <p className={`mt-2 text-sm ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "追加中..." : "追加"}
        </button>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">一覧</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだありません。</p>
      ) : (
        <ul className="space-y-3">
          {list.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div>
                <span className="font-medium text-foreground">{row.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{formatDate(row.published_at)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(row.id)}
                className="rounded border border-destructive/50 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
