"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

// TinyMCEのHydrationエラーを防ぐため、SSRを無効化
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false }
);

const PAGES = [
  { key: "home", label: "ホーム" },
  { key: "profile", label: "プロフィール" },
  { key: "youtube", label: "YouTube" },
  { key: "niconico", label: "ニコニコ" },
  { key: "dev", label: "個人開発" },
] as const;

export function AdminPageContentsForm() {
  const supabase = createClient();
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? "";
  const [list, setList] = useState<{ page_key: string; title: string; updated_at: string; updated_by: string | null }[]>([]);
  const [pageKey, setPageKey] = useState<string>("home");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/admin/page-contents/list", {
          headers: { Cookie: document.cookie },
        });
        if (res.ok) {
          const data = await res.json();
          setList(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase.auth]);

  useEffect(() => {
    setMessage(null);
    (async () => {
      const res = await fetch(
        `/api/page-contents?page_key=${encodeURIComponent(pageKey)}`
      );
      const data = await res.json();
      setTitle(data.title ?? "");
      setHtml(data.body_html ?? "");
    })();
  }, [pageKey]);

  async function onSave() {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      setMessage({ type: "error", text: "ログインし直してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/page-contents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page_key: pageKey, title, body_html: html }),
      });
      const out = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: typeof out.error === "string" ? out.error : "保存に失敗しました",
        });
        return;
      }
      setMessage({ type: "ok", text: "保存しました" });
    } catch {
      setMessage({ type: "error", text: "保存に失敗しました" });
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("ja");
    } catch {
      return s;
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:flex-wrap md:items-center md:gap-3">
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:w-auto md:text-sm"
          value={pageKey}
          onChange={(e) => setPageKey(e.target.value)}
          aria-label="ページを選択"
          title="ページを選択"
        >
          {PAGES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 md:w-auto md:text-sm"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        {message && (
          <span
            className={
              message.type === "ok"
                ? "text-xs text-green-600 dark:text-green-400 md:text-sm"
                : "text-xs text-destructive md:text-sm"
            }
          >
            {message.text}
          </span>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="page-title" className="mb-1 block text-xs font-medium text-foreground md:text-sm">
          タイトル
        </label>
        <input
          id="page-title"
          type="text"
          className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ページタイトルを入力"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-foreground md:text-sm">
          本文（HTML）
        </label>
        <RichTextEditor apiKey={apiKey} value={html} onChange={setHtml} />
      </div>

      <p className="text-[10px] text-muted-foreground md:text-xs">
        pre/code はそのまま保持されます。リンクは http/https のみ許可。
      </p>

      {!loading && list.length > 0 && (
        <section className="mt-6 md:mt-8">
          <h2 className="mb-2 text-xs font-semibold text-foreground md:text-sm">
            一覧（最終更新）
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium md:px-4">ページ</th>
                  <th className="px-2 py-2 text-left font-medium md:px-4">タイトル</th>
                  <th className="px-2 py-2 text-left font-medium md:px-4">更新日時</th>
                  <th className="px-2 py-2 text-left font-medium md:px-4">更新者</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.page_key} className="border-t">
                    <td className="px-2 py-2 md:px-4">
                      {PAGES.find((p) => p.key === row.page_key)?.label ?? row.page_key}
                    </td>
                    <td className="px-2 py-2 md:px-4">
                      {row.title || "未設定"}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground md:px-4">
                      {formatDate(row.updated_at)}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground md:px-4">
                      {row.updated_by ? `${row.updated_by.slice(0, 8)}…` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
