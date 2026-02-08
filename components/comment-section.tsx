"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Heart, Flag, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { shortenUrl } from "@/lib/repositories/comments";
import { cn } from "@/lib/utils";

const PAGE_KEYS = ["home", "profile", "youtube", "niconico", "dev"] as const;
type PageKey = (typeof PAGE_KEYS)[number];

type CommentItem = {
  id: string;
  page_key: string;
  author_type: "guest" | "user";
  author_user_id: string | null;
  guest_name: string | null;
  body: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  admin_heart: boolean;
  created_at: string;
  good_count: number;
  not_good_count: number;
  my_reaction: "good" | "not_good" | null;
};

export function CommentSection({ pageKey }: { pageKey: PageKey }) {
  const supabase = createClient();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string; displayName?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"user" | "guest">("guest");
  const [guestName, setGuestName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<"spam" | "abuse" | "other">("spam");
  const [reportMessage, setReportMessage] = useState("");

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
      if (u) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", u.id).single();
        const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", u.id).eq("role", "admin").single();
        setUser({
          id: u.id,
          email: u.email ?? undefined,
          displayName: (profile as { display_name: string | null } | null)?.display_name ?? undefined,
        });
        setIsAdmin(!!adminRow);
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
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "送信中..." : "送信"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-4">
              {c.hidden_reason === "deleted" ? (
                <p className="text-sm text-muted-foreground">削除されました</p>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {c.author_type === "user" ? "ユーザー" : (c.guest_name || "ゲスト")}
                    </span>
                    {c.author_type === "guest" && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">ゲスト</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("ja")}
                    </span>
                    {c.admin_heart && (
                      <span className="flex items-center gap-0.5 text-primary" title="管理者ハート">
                        <Heart className="h-4 w-4 fill-current" />
                      </span>
                    )}
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-sm text-foreground">
                    {formatBody(c.body)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
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
                      onClick={() => setReportingId(reportingId === c.id ? null : c.id)}
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
                          onClick={() => { setReportingId(null); setReportMessage(""); }}
                          className="rounded border px-3 py-1 text-sm"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
      )}
    </section>
  );
}
