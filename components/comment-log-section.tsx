"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";
import { SearchHighlightContainer } from "@/components/search-highlight";
import { CommentCard } from "@/components/comment-card";

type CommentItem = {
  id: string;
  page_key: string;
  author_type: "guest" | "user";
  author_user_id: string | null;
  guest_name: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  body: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  admin_heart: boolean;
  created_at: string;
  edited_at: string | null;
  good_count: number;
  not_good_count: number;
  my_reaction: "good" | "not_good" | null;
  reply_count?: number;
};

type ReplyItem = {
  id: string;
  parent_comment_id: string;
  page_key: string;
  author_user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
  good_count: number;
  not_good_count: number;
  my_reaction: "good" | "not_good" | null;
  admin_heart: boolean;
};

type ApiResponse = {
  items: CommentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Props = {
  pageKey: string;
  label: string;
  initialPage: number;
  query?: string;
  mode?: "partial" | "word";
};

const EDIT_TOKENS_KEY = "comment_edit_tokens";

function getStoredEditToken(commentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EDIT_TOKENS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Record<string, string>;
    return obj[commentId] ?? null;
  } catch {
    return null;
  }
}

function setStoredEditToken(commentId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(EDIT_TOKENS_KEY);
    const obj = (raw ? JSON.parse(raw) : {}) as Record<string, string>;
    obj[commentId] = token;
    localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}


export function CommentLogSection({ pageKey, label, initialPage, query, mode }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<"spam" | "abuse" | "other">("spam");
  const [reportMessage, setReportMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<"new" | "old" | "top">("new");
  const [replyOpenIds, setReplyOpenIds] = useState<Set<string>>(new Set()); // 返信一覧の表示状態
  const [replyInputOpenIds, setReplyInputOpenIds] = useState<Set<string>>(new Set()); // 返信入力欄の表示状態
  const [replies, setReplies] = useState<Record<string, ReplyItem[]>>({});
  const [replyBodyById, setReplyBodyById] = useState<Record<string, string>>({});

  const fingerprint = getOrCreateFingerprint();

  const fetchPage = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page_key", pageKey);
      params.set("page", String(targetPage));
      params.set("limit", "100");
      params.set("with_total", "1");
       params.set("sort", sort);
      const res = await fetch(`/api/comments?${params.toString()}`, {
        cache: "no-store",
        headers: fingerprint ? { "X-Fingerprint": fingerprint } : {},
      });
      const data = (await res.json()) as ApiResponse | CommentItem[];
      let nextItems: CommentItem[];
      if (Array.isArray(data)) {
        nextItems = data as CommentItem[];
        setItems(nextItems);
        setTotal(nextItems.length);
        setPage(targetPage);
        setPageSize(100);
        setTotalPages(1);
      } else {
        nextItems = data.items;
        setItems(nextItems);
        setTotal(data.total);
        setPage(data.page);
        setPageSize(data.pageSize);
        setTotalPages(data.totalPages);
      }

      // 通報済みコメントの取得（現在の閲覧者のみ）
      const ids = nextItems.map((c) => c.id);
      if (ids.length > 0) {
        const statusParams = new URLSearchParams({
          comment_ids: ids.join(","),
        });
        const statusRes = await fetch(`/api/reports?${statusParams.toString()}`, {
          cache: "no-store",
          headers: fingerprint ? { "X-Fingerprint": fingerprint } : {},
        });
        if (statusRes.ok) {
          const json = (await statusRes.json()) as { reportedIds?: string[] };
          setReportedIds(Array.isArray(json.reportedIds) ? json.reportedIds : []);
        } else {
          setReportedIds([]);
        }
      } else {
        setReportedIds([]);
      }
      setLoading(false);
    },
    [pageKey, fingerprint, sort]
  );

  useEffect(() => {
    fetchPage(initialPage);
  }, [fetchPage, initialPage]);

  useEffect(() => {
    (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) {
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        const nameFromMeta = (meta?.full_name ?? meta?.name) as string | undefined;
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", u.id)
          .single();
        const { data: adminRow } = await supabase
          .from("admin_roles")
          .select("user_id")
          .eq("user_id", u.id)
          .eq("role", "admin")
          .single();
        setUser({
          id: u.id,
          email: u.email ?? undefined,
          displayName:
            nameFromMeta?.trim() ??
            (profile as { display_name: string | null } | null)?.display_name ??
            undefined,
          avatarUrl: (meta?.avatar_url as string) ?? undefined,
        });
        setIsAdmin(!!adminRow);
      } else {
        setUser(null);
      }
    })();
  }, [supabase]);

  function canEdit(c: CommentItem): boolean {
    if (c.author_type === "user") {
      return !!user && c.author_user_id === user.id;
    }
    if (c.author_type === "guest") {
      return !!getStoredEditToken(c.id);
    }
    return false;
  }

  async function toggleReaction(commentId: string, type: "good" | "not_good") {
    const res = await fetch(`/api/comments/${commentId}/reaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(fingerprint ? { "X-Fingerprint": fingerprint } : {}),
      },
      body: JSON.stringify({
        reaction_type: type,
        ...(!user && fingerprint ? { fingerprint } : {}),
      }),
    });
    if (res.ok) fetchPage(page);
  }

  async function toggleAdminHeart(commentId: string) {
    if (!isAdmin) return;
    const res = await fetch(`/api/admin/comments/${commentId}/heart`, {
      method: "POST",
    });
    if (res.ok) fetchPage(page);
  }

  async function submitEdit(commentId: string, newBody: string, isGuest: boolean) {
    const payload: { body: string; edit_token?: string } = { body: newBody.trim() };
    if (isGuest) {
      const token = getStoredEditToken(commentId);
      if (!token) {
        setError("編集トークンが見つかりません。");
        return;
      }
      payload.edit_token = token;
    }
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "編集に失敗しました。");
      return;
    }
    setEditingId(null);
    setEditingBody("");
    setError(null);
    fetchPage(page);
  }

  async function submitReport(commentId: string) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(fingerprint ? { "X-Fingerprint": fingerprint } : {}),
      },
      body: JSON.stringify({
        comment_id: commentId,
        reason: reportReason,
        message: reportMessage.trim() || undefined,
        fingerprint: !user && fingerprint ? fingerprint : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "通報に失敗しました。");
      return;
    }
    setReportingId(null);
    setReportMessage("");
    fetchPage(page);
  }

  async function loadReplies(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}/replies`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as ReplyItem[];
    setReplies((prev) => ({ ...prev, [commentId]: data }));
  }

  async function submitReply(parentId: string) {
    const replyBody = (replyBodyById[parentId] ?? "").trim();
    if (!replyBody) {
      setError("返信の本文を入力してください。");
      return;
    }
    if (!user) {
      setError("返信するにはログインが必要です。");
      return;
    }
    setError(null);
    const res = await fetch(`/api/comments/${parentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "返信の投稿に失敗しました。");
      return;
    }
    setReplyBodyById((prev) => ({ ...prev, [parentId]: "" }));
    setReplyInputOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
    const newReply: ReplyItem = {
      ...data,
      good_count: 0,
      not_good_count: 0,
      my_reaction: null,
      admin_heart: false,
    };
    setReplies((prev) => ({
      ...prev,
      [parentId]: [...(prev[parentId] ?? []), newReply],
    }));
    // 返信件数を更新
    setItems((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, reply_count: (c.reply_count ?? 0) + 1 }
          : c
      )
    );
    // 返信一覧を自動的に開く
    if (!replyOpenIds.has(parentId)) {
      setReplyOpenIds((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
      if (!replies[parentId]) {
        await loadReplies(parentId);
      }
    }
  }

  async function toggleReactionForReply(replyId: string, type: "good" | "not_good") {
    const res = await fetch(`/api/comments/${replyId}/reaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(fingerprint ? { "X-Fingerprint": fingerprint } : {}),
      },
      body: JSON.stringify({
        reaction_type: type,
        ...(!user && fingerprint ? { fingerprint } : {}),
      }),
    });
    if (res.ok) {
      // 返信一覧を再取得
      const parentId = Object.keys(replies).find((pid) =>
        replies[pid]?.some((r) => r.id === replyId)
      );
      if (parentId) {
        await loadReplies(parentId);
      }
    }
  }

  async function toggleAdminHeartForReply(replyId: string) {
    if (!isAdmin) return;
    const res = await fetch(`/api/admin/comments/${replyId}/heart`, {
      method: "POST",
    });
    if (res.ok) {
      const parentId = Object.keys(replies).find((pid) =>
        replies[pid]?.some((r) => r.id === replyId)
      );
      if (parentId) {
        await loadReplies(parentId);
      }
    }
  }

  const displayName = user
    ? user.displayName || user.email?.split("@")[0] || "ユーザー"
    : "";

  return (
    <section>
      <p className="mb-2 text-sm text-muted-foreground">
        対象ページ: {label}（全{total}件）
      </p>
      {query && (
        <p className="mb-4 text-xs text-muted-foreground">
          検索ハイライト対象:「{query}」（モード:{" "}
          {mode === "word" ? "単語完全一致" : "部分一致"}）
        </p>
      )}

      {/* ソート切り替え */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>並び替え:</span>
        <button
          type="button"
          onClick={() => setSort("new")}
          className={cn(
            "rounded-full border px-3 py-1",
            sort === "new" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          新しい順
        </button>
        <button
          type="button"
          onClick={() => setSort("old")}
          className={cn(
            "rounded-full border px-3 py-1",
            sort === "old" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          古い順
        </button>
        <button
          type="button"
          onClick={() => setSort("top")}
          className={cn(
            "rounded-full border px-3 py-1",
            sort === "top" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          人気順（Good数）
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
      ) : (
        <SearchHighlightContainer query={query} mode={mode}>
          <motion.ul
            className="space-y-1"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
          {items.map((c) => {
            const isReportedByMe = reportedIds.includes(c.id);
            return (
              <motion.li
                key={c.id}
                variants={staggerItem}
                transition={transitionPresets.normal}
              >
                <CommentCard
                  comment={c}
                  user={user}
                  isAdmin={isAdmin}
                  isOptimistic={false}
                  isReportedByMe={isReportedByMe}
                  editingId={editingId}
                  editingBody={editingBody}
                  reportingId={reportingId}
                  reportReason={reportReason}
                  reportMessage={reportMessage}
                  error={error}
                  replyOpenIds={replyOpenIds}
                  replyInputOpenIds={replyInputOpenIds}
                  replies={replies}
                  replyBodyById={replyBodyById}
                  onEdit={submitEdit}
                  onEditStart={(commentId, body) => {
                    setEditingId(commentId);
                    setEditingBody(body);
                    setError(null);
                  }}
                  onEditCancel={() => {
                    setEditingId(null);
                    setEditingBody("");
                    setError(null);
                  }}
                  onEditingBodyChange={setEditingBody}
                  onToggleReaction={toggleReaction}
                  onToggleAdminHeart={toggleAdminHeart}
                  onReportStart={(commentId) => {
                    if (isReportedByMe) return;
                    setReportingId(reportingId === commentId ? null : commentId);
                    if (reportingId !== commentId) setError(null);
                  }}
                  onReportCancel={() => {
                    setReportingId(null);
                    setReportMessage("");
                    setError(null);
                  }}
                  onSubmitReport={submitReport}
                  onReportReasonChange={setReportReason}
                  onReportMessageChange={setReportMessage}
                  onReplyInputToggle={(commentId) => {
                    setReplyInputOpenIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(commentId)) {
                        next.delete(commentId);
                        setReplyBodyById((prev) => ({ ...prev, [commentId]: "" }));
                      } else {
                        next.add(commentId);
                      }
                      return next;
                    });
                  }}
                  onSubmitReply={submitReply}
                  onReplyBodyChange={(commentId, body) => {
                    setReplyBodyById((prev) => ({ ...prev, [commentId]: body }));
                  }}
                  onReplyToggle={async (commentId) => {
                    setReplyOpenIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(commentId)) {
                        next.delete(commentId);
                      } else {
                        next.add(commentId);
                      }
                      return next;
                    });
                  }}
                  onLoadReplies={loadReplies}
                  onToggleReactionForReply={toggleReactionForReply}
                  onToggleAdminHeartForReply={toggleAdminHeartForReply}
                  canEdit={canEdit}
                  setError={setError}
                />
              </motion.li>
            );
          })}
        </motion.ul>
        </SearchHighlightContainer>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              ページ {page} / {totalPages}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <button
                type="button"
                onClick={() => fetchPage(page - 1)}
                className="rounded border px-2 py-1 hover:bg-muted"
              >
                前へ
              </button>
            )}
            {page < totalPages && (
              <button
                type="button"
                onClick={() => fetchPage(page + 1)}
                className="rounded border px-2 py-1 hover:bg-muted"
              >
                次へ
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

