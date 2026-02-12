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
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-2xl">改訂履歴</h1>

      <div className="mb-6 rounded-xl border bg-card p-3 md:mb-8 md:p-4">
        <h2 className="mb-3 text-base font-semibold text-foreground md:text-lg">新規追加</h2>
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground md:text-sm"
        />
        <RichTextEditor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? ""}
          value={bodyHtml}
          onChange={setBodyHtml}
        />
        {message && (
          <p className={`mt-2 text-xs md:text-sm ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 md:w-auto md:text-sm"
        >
          {saving ? "追加中..." : "追加"}
        </button>
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
              <button
                type="button"
                onClick={() => handleDelete(row.id)}
                className="w-full rounded border border-destructive/50 px-3 py-1 text-xs text-destructive hover:bg-destructive/10 md:w-auto md:text-sm"
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
