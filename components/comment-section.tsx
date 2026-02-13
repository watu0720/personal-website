"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import { SearchHighlightContainer } from "@/components/search-highlight";
import { pulseElement } from "@/lib/motion/commentPulse";
import { CommentCard } from "@/components/comment-card";

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

const PAGE_KEYS = ["home", "profile", "youtube", "niconico", "dev"] as const;
type PageKey = (typeof PAGE_KEYS)[number] | string; // news:<id>形式も許可

type CommentItem = {
  id: string;
  client_id?: string; // Optimistic UI用の一時ID
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

export function CommentSection({ pageKey }: { pageKey: PageKey }) {
  const supabase = createClient();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string; displayName?: string; avatarUrl?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"user" | "guest">("guest");
  const [guestName, setGuestName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<"spam" | "abuse" | "other">("spam");
  const [reportMessage, setReportMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [hasLog, setHasLog] = useState(false);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [pulseTargetId, setPulseTargetId] = useState<string | null>(null);
  const fetchVersionRef = useRef(0);
  const cardToPulseRef = useRef<HTMLLIElement>(null);
  const [replyOpenIds, setReplyOpenIds] = useState<Set<string>>(new Set()); // 返信一覧の表示状態
  const [replyInputOpenIds, setReplyInputOpenIds] = useState<Set<string>>(new Set()); // 返信入力欄の表示状態
  const [replies, setReplies] = useState<Record<string, ReplyItem[]>>({});
  const [replyBodyById, setReplyBodyById] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<"new" | "old" | "top">("new");
  const [hasOptimisticComment, setHasOptimisticComment] = useState(false); // Optimisticコメントの存在フラグ

  const fingerprint = getOrCreateFingerprint();
  const searchParams = useSearchParams();
  const highlightQuery = searchParams.get("q") ?? undefined;
  const highlightMode =
    (searchParams.get("mode") === "word" ? "word" : "partial") as
      | "partial"
      | "word";

  const fetchComments = useCallback(async () => {
    const version = ++fetchVersionRef.current;
    const params = new URLSearchParams({
      page_key: pageKey,
      limit: "21",
      sort,
    });
    const res = await fetch(`/api/comments?${params.toString()}`, {
      cache: "no-store",
      headers: fingerprint ? { "X-Fingerprint": fingerprint } : {},
    });
    const data = await res.json();
    if (fetchVersionRef.current !== version) {
      // もっと新しいリクエスト結果があるので破棄
      return;
    }
    if (Array.isArray(data)) {
      // 21件以上のときのみコメントログボタンを表示
      setHasLog(data.length > 20);
      const visible = data.slice(0, 20) as CommentItem[];
      setComments(visible);

      // 通報済みコメントの取得（現在の閲覧者のみ）
      const ids = visible.map((c) => c.id);
      if (ids.length > 0) {
        const params = new URLSearchParams({
          comment_ids: ids.join(","),
        });
        const statusRes = await fetch(`/api/reports?${params.toString()}`, {
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
    }
    setLoading(false);
  }, [pageKey, fingerprint, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setTab(u ? "user" : "guest");
      if (u) {
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        const nameFromMeta = (meta?.full_name ?? meta?.name) as string | undefined;
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", u.id).single();
        const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", u.id).eq("role", "admin").single();
        setUser({
          id: u.id,
          email: u.email ?? undefined,
          displayName: nameFromMeta?.trim() ?? (profile as { display_name: string | null } | null)?.display_name ?? undefined,
          avatarUrl: (meta?.avatar_url as string) ?? undefined,
        });
        setIsAdmin(!!adminRow);
      } else {
        setUser(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable
  }, []);

  useEffect(() => {
    if (pulseTargetId && cardToPulseRef.current) {
      pulseElement(cardToPulseRef.current);
      setPulseTargetId(null);
    }
  }, [pulseTargetId, comments]);

  async function submitComment() {
    const bodyTrim = body.trim();
    if (!bodyTrim) {
      setError("本文を入力してください。");
      return;
    }
    if (tab === "guest") {
      const name = guestName.trim();
      if (name.length < 2 || name.length > 20) {
        setError("ゲストは名前を2〜20文字で入力してください。");
        return;
      }
    }
    setError(null);
    setSubmitting(true);

    // Optimistic UI: client_idを生成（クライアント側でのみ実行）
    // crypto.randomUUID()のフォールバック実装
    const generateClientId = () => {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `cmt_local_${crypto.randomUUID()}`;
      }
      // フォールバック: タイムスタンプ + ランダム文字列
      return `cmt_local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    };
    const clientId = generateClientId();
    const now = new Date().toISOString();

    // Optimistic コメントを生成（先頭に追加）
    // 仕様書4-2: idは未確定、client_idのみを持つ
    const optimisticComment: CommentItem = {
      id: "", // 未確定（仕様書通り）
      client_id: clientId,
      page_key: pageKey,
      author_type: tab,
      author_user_id: tab === "user" ? (user?.id ?? null) : null,
      guest_name: tab === "guest" ? guestName.trim() : null,
      author_name:
        tab === "user"
          ? ((user?.displayName ||
              user?.email?.split("@")[0] ||
              "ログインユーザー") as string)
          : null,
      author_avatar_url: tab === "user" ? user?.avatarUrl ?? null : null,
      body: bodyTrim,
      is_hidden: false,
      hidden_reason: null,
      admin_heart: false,
      created_at: now,
      edited_at: null,
      good_count: 0,
      not_good_count: 0,
      my_reaction: null,
    };

    // Optimistic コメントを先頭に追加（仕様書4-2: 新しい順のため先頭に挿入）
    setHasOptimisticComment(true);
    setComments((prev) => {
      const next = [optimisticComment, ...prev];
      return next.slice(0, 20);
    });

    try {
      const payload = {
        page_key: pageKey,
        author_type: tab,
        body: bodyTrim,
        ...(tab === "guest" ? { guest_name: guestName.trim(), fingerprint } : {}),
      };
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // 失敗時: Optimisticコメントは残す（仕様書5-5参照）
        setError(data?.error ?? "投稿に失敗しました。");
        return;
      }
      if (tab === "guest" && data.edit_token && data.id) {
        setStoredEditToken(data.id, data.edit_token);
      }

      // サーバー応答後: Optimisticコメントを確定コメントで置換
      const createdAt =
        typeof data.created_at === "string"
          ? data.created_at
          : new Date().toISOString();
      const confirmedComment: CommentItem = {
        id: data.id as string,
        // client_idは削除しない（置換時のkey一致のため一時的に保持、次のレンダリングで削除される）
        client_id: undefined,
        page_key: pageKey,
        author_type: tab,
        author_user_id: tab === "user" ? (user?.id ?? null) : null,
        guest_name: tab === "guest" ? guestName.trim() : null,
        author_name:
          tab === "user"
            ? ((user?.displayName ||
                user?.email?.split("@")[0] ||
                "ログインユーザー") as string)
            : null,
        author_avatar_url: tab === "user" ? user?.avatarUrl ?? null : null,
        body: bodyTrim,
        is_hidden: false,
        hidden_reason: null,
        admin_heart: false,
        created_at: createdAt,
        edited_at: null,
        good_count: 0,
        not_good_count: 0,
        my_reaction: null,
      };

      // client_idで一致するOptimisticコメントを置換（仕様書4-4）
      setHasOptimisticComment(false);
      setComments((prev) => {
        const index = prev.findIndex((c) => c.client_id === clientId);
        if (index === -1) {
          // 見つからない場合は先頭に追加（フォールバック）
          return [confirmedComment, ...prev].slice(0, 20);
        }
        // 同一位置で確定コメントに置換（仕様書4-4: 置換方式を厳守）
        // 配列を直接変更せず、新しい配列を作成して置換することで、Reactの再レンダリングを最適化
        const before = prev.slice(0, index);
        const after = prev.slice(index + 1);
        return [...before, confirmedComment, ...after];
      });

      setBody("");
      setGuestName("");
      setPulseTargetId(data.id as string);

      // 送信成功後、自分のコメント要素にscrollIntoViewを実行（仕様書6-1）
      // Reactの状態更新とDOMの更新を待つため、次のフレームで実行
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = document.querySelector(`[data-comment-id="${data.id}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      });
    } finally {
      setSubmitting(false);
    }
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
    setComments((prev) =>
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

  async function toggleReaction(commentId: string, type: "good" | "not_good") {
    const res = await fetch(`/api/comments/${commentId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(fingerprint ? { "X-Fingerprint": fingerprint } : {}) },
      body: JSON.stringify({ reaction_type: type, ...(!user && fingerprint ? { fingerprint } : {}) }),
    });
    if (res.ok) fetchComments();
  }

  async function toggleAdminHeart(commentId: string) {
    if (!isAdmin) return;
    const res = await fetch(`/api/admin/comments/${commentId}/heart`, { method: "POST" });
    if (res.ok) fetchComments();
  }

  function canEdit(c: CommentItem): boolean {
    if (c.author_type === "user") {
      return !!user && c.author_user_id === user.id;
    }
    if (c.author_type === "guest") {
      return !!getStoredEditToken(c.id);
    }
    return false;
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
    await fetchComments();
    setPulseTargetId(commentId);
  }

  async function submitReport(commentId: string) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(fingerprint ? { "X-Fingerprint": fingerprint } : {}) },
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
    fetchComments();
  }

  const [linkWarningUrl, setLinkWarningUrl] = useState<string | null>(null);
  const [linkWarningOpen, setLinkWarningOpen] = useState(false);

  function isSuspiciousUrl(url: string): boolean {
    const lower = url.toLowerCase();
    if (lower.includes("bit.ly") || lower.includes("tinyurl") || lower.includes("t.co")) {
      return true;
    }
    if (lower.includes("xn--")) return true;
    if (url.length > 120) return true;
    return false;
  }

  function handleClickLink(url: string) {
    if (isSuspiciousUrl(url)) {
      setLinkWarningUrl(url);
      setLinkWarningOpen(true);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }


  const displayName = user ? (user.displayName || user.email?.split("@")[0] || "ユーザー") : "";

  return (
    <section className="">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-bold text-foreground">コメント</h2>
        {hasLog && (
          <Link
            href={`/comments/${pageKey}`}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-primary"
          >
            コメントログへ
          </Link>
        )}
      </div>

      {/* コメント利用ガイド */}
      <details className="mb-4 rounded-lg border bg-muted/40 p-3 text-sm">
        <summary className="cursor-pointer select-none font-medium text-foreground">
          コメント利用ガイド
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>ゲスト名：2〜20文字</li>
          <li>リンク： http / https のみ許可、1コメントあたり最大2件まで</li>
          <li>誹謗中傷・スパムは禁止です</li>
          <li>通報内容は管理者のみが確認します</li>
          <li>編集：本人のみが編集できます</li>
        </ul>
      </details>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("user")}
          className={cn("rounded-lg px-3 py-2 text-sm font-medium", tab === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => setTab("guest")}
          className={cn("rounded-lg px-3 py-2 text-sm font-medium", tab === "guest" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
        >
          ゲスト
        </button>
      </div>

      {tab === "user" && !user && (
        <p className="mb-4 text-sm text-muted-foreground">コメントするにはログインしてください。</p>
      )}

      {(tab === "guest" || user) && (
        <div className="mb-6 space-y-3">
          {tab === "guest" && (
            <input
              type="text"
              placeholder="名前（2〜20文字）"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
              maxLength={20}
            />
          )}
          {tab === "user" && user && (
            <p className="text-xs text-muted-foreground md:text-sm">表示名: {displayName}</p>
          )}
          <textarea
            placeholder="本文（http/https のリンクのみ許可）"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
            rows={3}
          />
          {error && <p className="text-xs text-destructive md:text-sm">{error}</p>}
          <button
            type="button"
            onClick={submitComment}
            disabled={submitting}
            className="btn-motion flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:transform-none md:w-auto md:text-sm"
          >
            <Send className="h-3 w-3 md:h-4 md:w-4" />
            {submitting ? "送信中..." : "送信"}
          </button>
        </div>
      )}

      {/* ソート切り替え */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">並び替え:</span>
        <button
          type="button"
          onClick={() => setSort("new")}
          className={cn(
            "rounded-full border px-2 py-1 text-xs md:px-3",
            sort === "new" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          新しい順
        </button>
        <button
          type="button"
          onClick={() => setSort("old")}
          className={cn(
            "rounded-full border px-2 py-1 text-xs md:px-3",
            sort === "old" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          古い順
        </button>
        <button
          type="button"
          onClick={() => setSort("top")}
          className={cn(
            "rounded-full border px-2 py-1 text-xs md:px-3",
            sort === "top" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          人気順（Good数）
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <SearchHighlightContainer query={highlightQuery} mode={highlightMode}>
          <motion.ul
            className="space-y-1"
            variants={hasOptimisticComment ? undefined : staggerContainer}
            initial={hasOptimisticComment ? false : "initial"}
            animate={hasOptimisticComment ? false : "animate"}
          >
          {comments.map((c) => {
            // Optimisticコメントかどうかを判定（client_idが存在し、idが空文字列または未定義の場合）
            const isOptimistic = !!c.client_id && (!c.id || c.id.trim() === "");
            const isConfirmedComment = !isOptimistic && !!c.id && c.id.trim() !== "";
            const isReportedByMe: boolean = isConfirmedComment && c.id ? reportedIds.includes(c.id) : false;
            const commentKey = c.client_id ?? c.id; // 仕様書4-3: keyはclient_id ?? id
            // data-comment-idは確定コメント（Optimisticでない）の場合のみ設定
            const commentIdForScroll = isConfirmedComment && c.id ? c.id : undefined;
            return (
            <motion.li
              key={commentKey}
              ref={c.id === pulseTargetId && !isOptimistic ? cardToPulseRef : undefined}
              variants={staggerItem}
              transition={transitionPresets.normal}
              initial={isOptimistic ? false : "initial"}
              animate="animate"
            >
              <CommentCard
                comment={c}
                user={user}
                isAdmin={isAdmin}
                isOptimistic={isOptimistic}
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
                  if (isReportedByMe || !commentId) return;
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
                  if (!user) {
                    setError("返信するにはログインが必要です。");
                    return;
                  }
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
                  if (!replies[commentId] && !replyOpenIds.has(commentId)) {
                    await loadReplies(commentId);
                  }
                }}
                onLoadReplies={loadReplies}
                onToggleReactionForReply={toggleReactionForReply}
                onToggleAdminHeartForReply={toggleAdminHeartForReply}
                canEdit={canEdit}
                setError={setError}
                dataCommentId={commentIdForScroll}
              />
            </motion.li>
          );})}
        </motion.ul>
        </SearchHighlightContainer>
      )}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
      )}

      {/* 怪しいリンクの警告モーダル */}
      {linkWarningOpen && linkWarningUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-foreground">
              外部リンクへの移動前に確認
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              短縮URLや不審な形式のリンクの可能性があります。信頼できるURLか確認してください。
            </p>
            <p className="mb-4 rounded bg-muted px-3 py-2 text-[11px] text-muted-foreground break-all">
              {linkWarningUrl}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLinkWarningOpen(false);
                  setLinkWarningUrl(null);
                }}
                className="rounded border px-3 py-1.5 text-xs"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = linkWarningUrl;
                  setLinkWarningOpen(false);
                  setLinkWarningUrl(null);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                }}
                className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                移動する
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
