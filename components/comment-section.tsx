"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Heart, Flag, Send, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { staggerContainer, staggerItem, transitionPresets } from "@/lib/animations";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { shortenUrl } from "@/lib/repositories/comments";
import { cn } from "@/lib/utils";

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
type PageKey = (typeof PAGE_KEYS)[number];

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

  const fingerprint = getOrCreateFingerprint();

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/comments?page_key=${encodeURIComponent(pageKey)}`, {
      headers: fingerprint ? { "X-Fingerprint": fingerprint } : {},
    });
    const data = await res.json();
    if (Array.isArray(data)) setComments(data);
    setLoading(false);
  }, [pageKey, fingerprint]);

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
        setError(data?.error ?? "投稿に失敗しました。");
        return;
      }
      if (tab === "guest" && data.edit_token && data.id) {
        setStoredEditToken(data.id, data.edit_token);
      }
      setBody("");
      setGuestName("");
      fetchComments();
    } finally {
      setSubmitting(false);
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
    fetchComments();
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
        <a key={m.index} href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {shortenUrl(url)}
        </a>
      );
      lastIndex = m.index + url.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return <>{parts}</>;
  }

  const displayName = user ? (user.displayName || user.email?.split("@")[0] || "ユーザー") : "";

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="mb-4 text-lg font-bold text-foreground">コメント</h2>

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
              className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
              maxLength={20}
            />
          )}
          {tab === "user" && user && (
            <p className="text-sm text-muted-foreground">表示名: {displayName}</p>
          )}
          <textarea
            placeholder="本文（http/https のリンクのみ許可）"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            rows={3}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="button"
            onClick={submitComment}
            disabled={submitting}
            className="btn-motion flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:transform-none"
          >
            <Send className="h-4 w-4" />
            {submitting ? "送信中..." : "送信"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <motion.ul
          className="space-y-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {comments.map((c) => (
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
                        ? (c.author_name || "ログインユーザー")
                        : (c.guest_name || "ゲスト")}
                    </span>
                    {c.author_type === "guest" && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">ゲスト</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("ja")}
                      {c.edited_at && (
                        <span className="ml-1 text-muted-foreground/80" title={new Date(c.edited_at).toLocaleString("ja")}>
                          （編集済み）
                        </span>
                      )}
                    </span>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => toggleAdminHeart(c.id)}
                        className={cn(
                          "flex items-center gap-0.5 rounded p-0.5 transition-colors hover:bg-muted",
                          c.admin_heart ? "text-primary" : "text-muted-foreground"
                        )}
                        title="管理者ハート"
                        aria-label="管理者ハート"
                      >
                        <Heart className={cn("h-4 w-4", c.admin_heart && "fill-current")} />
                      </button>
                    ) : c.admin_heart ? (
                      <span className="flex items-center gap-0.5 text-primary" title="管理者ハート">
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
                          onClick={() => submitEdit(c.id, editingBody, c.author_type === "guest")}
                          className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditingBody(""); setError(null); }}
                          className="rounded-lg border px-3 py-1.5 text-sm"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-3 whitespace-pre-wrap text-sm text-foreground">
                      {formatBody(c.body)}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    {canEdit(c) && editingId !== c.id && (
                      <button
                        type="button"
                        onClick={() => { setEditingId(c.id); setEditingBody(c.body); setError(null); }}
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
                        c.my_reaction === "good" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
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
                        c.my_reaction === "not_good" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                      )}
                      aria-label="Not Good"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportingId(reportingId === c.id ? null : c.id);
                        if (reportingId !== c.id) setError(null);
                      }}
                      className="flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                      aria-label="通報"
                    >
                      <Flag className="h-4 w-4" />
                      通報
                    </button>
                  </div>
                  {reportingId === c.id && (
                    <div className="mt-3 rounded-lg border bg-muted/50 p-3">
                      <p className="mb-2 text-sm font-medium">通報理由</p>
                      <select
                        aria-label="通報理由"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as "spam" | "abuse" | "other")}
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
                          onClick={() => { setReportingId(null); setReportMessage(""); setError(null); }}
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
          ))}
        </motion.ul>
      )}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
      )}
    </section>
  );
}
