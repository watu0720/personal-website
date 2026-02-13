"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Calendar, Tag, Eye, EyeOff, Trash2, Edit2, Plus } from "lucide-react";

type NewsPost = {
  id: string;
  title: string;
  body_html: string;
  thumbnail_url: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminNewsPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;

      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }

      const res = await fetch(`/api/admin/news?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus, supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function toggleStatus(postId: string, currentStatus: "draft" | "published") {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;

    const newStatus = currentStatus === "draft" ? "published" : "draft";
    const payload: any = { status: newStatus };
    if (newStatus === "published") {
      payload.published_at = new Date().toISOString();
    }

    const res = await fetch(`/api/admin/news/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      fetchPosts();
    }
  }

  async function deletePost(postId: string) {
    if (!confirm("本当に削除しますか？")) return;

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;

    const res = await fetch(`/api/admin/news/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      fetchPosts();
    }
  }

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString("ja");
    } catch {
      return dateString;
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-lg font-bold text-foreground md:text-xl">お知らせ管理</h1>
        <Link
          href="news/edit"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 md:text-sm"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Link>
      </div>

      {/* フィルタ */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`rounded-lg px-3 py-1 text-xs md:text-sm ${
            filterStatus === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          すべて
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("published")}
          className={`rounded-lg px-3 py-1 text-xs md:text-sm ${
            filterStatus === "published"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          公開
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("draft")}
          className={`rounded-lg px-3 py-1 text-xs md:text-sm ${
            filterStatus === "draft"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          下書き
        </button>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">お知らせがありません</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3 md:p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground md:text-base">
                      {post.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        post.status === "published"
                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {post.status === "published" ? "公開" : "下書き"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(post.updated_at)}</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>{post.tags.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <Link
                    href={`news/edit?id=${post.id}`}
                    className="rounded-lg border border-input bg-background p-2 hover:bg-muted"
                    title="編集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleStatus(post.id, post.status)}
                    className="rounded-lg border border-input bg-background p-2 hover:bg-muted"
                    title={post.status === "published" ? "下書きに変更" : "公開に変更"}
                  >
                    {post.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePost(post.id)}
                    className="rounded-lg border border-input bg-background p-2 hover:bg-destructive/10 hover:text-destructive"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/news/${post.id}`}
                    target="_blank"
                    className="rounded-lg border border-input bg-background p-2 hover:bg-muted"
                    title="プレビュー"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
