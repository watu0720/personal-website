"use client";

import { useCallback, useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Heart, Flag, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { shortenUrl } from "@/lib/repositories/comments";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";
import { SearchHighlightContainer } from "@/components/search-highlight";

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

function formatBody(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const urlRe = /(https?:\/\/[^\s]+)/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index));
    }
    const url = m[1];
    parts.push(
      <a
        key={m.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        {shortenUrl(url)}
      </a>
    );
    lastIndex = m.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
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

  const fingerprint = getOrCreateFingerprint();

  const fetchPage = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page_key", pageKey);
      params.set("page", String(targetPage));
      params.set("limit", "100");
      params.set("with_total", "1");
      const res = await fetch(`/api/comments?${params.toString()}`, {
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
    [pageKey, fingerprint]
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

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
      ) : (
        <SearchHighlightContainer query={query} mode={mode}>
          <motion.ul
            className="space-y-4"
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
                className="rounded-xl border bg-card p-4"
              >
                {c.hidden_reason === "deleted" ? (
                  <p className="text-sm text-muted-foreground">削除されました</p>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      {c.author_type === "user" && c.author_avatar_url && (
                        <img
                          src={c.author_avatar_url}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                          width={32}
                          height={32}
                        />
                      )}
                      <span className="font-medium text-foreground">
                        {c.author_type === "user"
                          ? c.author_name || "ログインユーザー"
                          : c.guest_name || "ゲスト"}
                      </span>
                      {c.author_type === "guest" && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          ゲスト
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("ja")}
                        {c.edited_at && (
                          <span
                            className="ml-1 text-muted-foreground/80"
                            title={new Date(c.edited_at).toLocaleString("ja")}
                          >
                            （編集済み）
                          </span>
                        )}
                      </span>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => toggleAdminHeart(c.id)}
                          className={cn(
                            "ml-auto flex items-center gap-0.5 rounded p-0.5 text-xs transition-colors hover:bg-muted",
                            c.admin_heart ? "text-primary" : "text-muted-foreground"
                          )}
                          title="管理者ハート"
                          aria-label="管理者ハート"
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              c.admin_heart && "fill-current"
                            )}
                          />
                        </button>
                      ) : c.admin_heart ? (
                        <span
                          className="ml-auto flex items-center gap-0.5 text-primary"
                          title="管理者ハート"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </span>
                      ) : null}
                    </div>
                    {editingId === c.id ? (
                      <div className="mb-3">
                        <textarea
                          aria-label="編集用本文"
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
                          className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              submitEdit(c.id, editingBody, c.author_type === "guest")
                            }
                            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingBody("");
                              setError(null);
                            }}
                            className="rounded-lg border px-3 py-1.5 text-sm"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : isReportedByMe ? (
                      <details className="mb-3 rounded-lg border border-dashed border-destructive/40 bg-muted/40 p-3 text-sm">
                        <summary className="cursor-pointer select-none text-xs font-medium text-destructive">
                          通報済みのコメントです（クリックして本文を表示）
                        </summary>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                          {formatBody(c.body)}
                        </div>
                      </details>
                    ) : (
                      <p className="mb-3 whitespace-pre-wrap text-sm text-foreground">
                        {formatBody(c.body)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {canEdit(c) && editingId !== c.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingBody(c.body);
                            setError(null);
                          }}
                          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                          aria-label="編集"
                        >
                          <Pencil className="h-4 w-4" />
                          編集
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleReaction(c.id, "good")}
                        className={cn(
                          "flex items-center gap-1 rounded px-2 py-1 text-sm",
                          c.my_reaction === "good"
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                        aria-label="Good"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{c.good_count}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleReaction(c.id, "not_good")}
                        className={cn(
                          "flex items-center gap-1 rounded px-2 py-1 text-sm",
                          c.my_reaction === "not_good"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                        aria-label="Not Good"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isReportedByMe) return;
                          setReportingId(reportingId === c.id ? null : c.id);
                          if (reportingId !== c.id) setError(null);
                        }}
                        className={cn(
                          "flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground",
                          isReportedByMe ? "cursor-default opacity-70" : "hover:bg-muted"
                        )}
                        disabled={isReportedByMe}
                        aria-label="通報"
                      >
                        <Flag className="h-4 w-4" />
                        {isReportedByMe ? "通報済み" : "通報"}
                      </button>
                    </div>
                    {reportingId === c.id && (
                      <div className="mt-3 rounded-lg border bg-muted/50 p-3">
                        <p className="mb-2 text-sm font-medium">通報理由</p>
                        <select
                          aria-label="通報理由"
                          value={reportReason}
                          onChange={(e) =>
                            setReportReason(
                              e.target.value as "spam" | "abuse" | "other"
                            )
                          }
                          className="mb-2 rounded border bg-background px-2 py-1 text-sm"
                        >
                          <option value="spam">スパム</option>
                          <option value="abuse">誹謗</option>
                          <option value="other">その他</option>
                        </select>
                        <textarea
                          placeholder="任意：詳細"
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          className="mb-2 w-full rounded border bg-background px-2 py-1 text-sm"
                          rows={2}
                        />
                        {error && (
                          <p className="mb-2 text-sm text-destructive">{error}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => submitReport(c.id)}
                            className="rounded bg-destructive/90 px-3 py-1 text-sm text-destructive-foreground hover:bg-destructive"
                          >
                            送信
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReportingId(null);
                              setReportMessage("");
                              setError(null);
                            }}
                            className="rounded border px-3 py-1 text-sm"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.li>
            );})}
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

