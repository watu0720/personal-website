"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Heart, Flag, Pencil, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { shortenUrl } from "@/lib/repositories/comments";

type CommentItem = {
  id: string;
  client_id?: string;
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

type CommentCardProps = {
  comment: CommentItem;
  user: { id: string; email?: string; displayName?: string; avatarUrl?: string } | null;
  isAdmin: boolean;
  isOptimistic?: boolean;
  isReportedByMe: boolean;
  editingId: string | null;
  editingBody: string;
  reportingId: string | null;
  reportReason: "spam" | "abuse" | "other";
  reportMessage: string;
  error: string | null;
  replyOpenIds: Set<string>;
  replyInputOpenIds: Set<string>;
  replies: Record<string, ReplyItem[]>;
  replyBodyById: Record<string, string>;
  onEdit: (commentId: string, newBody: string, isGuest: boolean) => Promise<void>;
  onEditStart: (commentId: string, body: string) => void;
  onEditCancel: () => void;
  onEditingBodyChange: (body: string) => void;
  onToggleReaction: (commentId: string, type: "good" | "not_good") => Promise<void>;
  onToggleAdminHeart: (commentId: string) => Promise<void>;
  onReportStart: (commentId: string) => void;
  onReportCancel: () => void;
  onSubmitReport: (commentId: string) => Promise<void>;
  onReportReasonChange: (reason: "spam" | "abuse" | "other") => void;
  onReportMessageChange: (message: string) => void;
  onReplyInputToggle: (commentId: string) => void;
  onSubmitReply: (parentId: string) => Promise<void>;
  onReplyBodyChange: (commentId: string, body: string) => void;
  onReplyToggle: (commentId: string) => void | Promise<void>;
  onLoadReplies: (commentId: string) => Promise<void>;
  onToggleReactionForReply: (replyId: string, type: "good" | "not_good") => Promise<void>;
  onToggleAdminHeartForReply: (replyId: string) => Promise<void>;
  canEdit: (comment: CommentItem) => boolean;
  setError: (error: string | null) => void;
  className?: string;
  dataCommentId?: string;
};

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
      <button
        key={m.index}
        type="button"
        onClick={() => {
          const isSuspicious = (url: string): boolean => {
            const lower = url.toLowerCase();
            if (lower.includes("bit.ly") || lower.includes("tinyurl") || lower.includes("t.co")) {
              return true;
            }
            if (lower.includes("xn--")) return true;
            if (url.length > 120) return true;
            return false;
          };
          if (isSuspicious(url)) {
            if (confirm(`外部リンクへの移動前に確認\n\n${url}\n\nこのリンクは短縮URLや不審な形式の可能性があります。移動しますか？`)) {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          } else {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }}
        className="text-primary underline break-all"
      >
        {shortenUrl(url)}
      </button>
    );
    lastIndex = m.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

export function CommentCard({
  comment: c,
  user,
  isAdmin,
  isOptimistic = false,
  isReportedByMe,
  editingId,
  editingBody,
  reportingId,
  reportReason,
  reportMessage,
  error,
  replyOpenIds,
  replyInputOpenIds,
  replies,
  replyBodyById,
  onEdit,
  onEditStart,
  onEditCancel,
  onEditingBodyChange,
  onToggleReaction,
  onToggleAdminHeart,
  onReportStart,
  onReportCancel,
  onSubmitReport,
  onReportReasonChange,
  onReportMessageChange,
  onReplyInputToggle,
  onSubmitReply,
  onReplyBodyChange,
  onReplyToggle,
  onLoadReplies,
  onToggleReactionForReply,
  onToggleAdminHeartForReply,
  canEdit,
  setError,
  className,
  dataCommentId,
}: CommentCardProps) {
  return (
    <div className={cn("py-2", className)} {...(dataCommentId ? { "data-comment-id": dataCommentId } : {})}>
      {c.hidden_reason === "deleted" ? (
        <p className="text-sm text-muted-foreground">削除されました</p>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            {c.author_type === "user" && c.author_avatar_url && (
              <img
                src={c.author_avatar_url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                width={32}
                height={32}
              />
            )}
            <span className="text-xs font-medium text-foreground">
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
            {isAdmin && !isOptimistic ? (
              <button
                type="button"
                onClick={() => c.id && onToggleAdminHeart(c.id)}
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
          {!isOptimistic && editingId === c.id ? (
            <div className="mb-1">
              <textarea
                aria-label="編集用本文"
                value={editingBody}
                onChange={(e) => onEditingBodyChange(e.target.value)}
                className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(c.id, editingBody, c.author_type === "guest")}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={onEditCancel}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : isReportedByMe ? (
            <details className="mb-1 rounded-lg border border-dashed border-destructive/40 bg-muted/40 p-2 text-sm">
              <summary className="cursor-pointer select-none text-xs font-medium text-destructive">
                通報済みのコメントです（クリックして本文を表示）
              </summary>
              <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {formatBody(c.body)}
              </div>
            </details>
          ) : (
            <p className="mb-1 whitespace-pre-wrap text-sm text-foreground">
              {formatBody(c.body)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
            {!isOptimistic && canEdit(c) && editingId !== c.id && (
              <button
                type="button"
                onClick={() => { c.id && onEditStart(c.id, c.body); }}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted md:text-sm"
                aria-label="編集"
              >
                <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">編集</span>
              </button>
            )}
            {!isOptimistic && (
              <>
                <button
                  type="button"
                  onClick={() => c.id && onToggleReaction(c.id, "good")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs md:text-sm",
                    c.my_reaction === "good" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                  aria-label="Good"
                >
                  <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{c.good_count}</span>
                </button>
                <button
                  type="button"
                  onClick={() => c.id && onToggleReaction(c.id, "not_good")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs md:text-sm",
                    c.my_reaction === "not_good" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                  aria-label="Not Good"
                >
                  <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
                </button>
              </>
            )}
            {isOptimistic && (
              <>
                <div className="flex items-center gap-1 rounded px-2 py-1 text-xs md:text-sm text-muted-foreground opacity-50">
                  <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{c.good_count}</span>
                </div>
                <div className="flex items-center gap-1 rounded px-2 py-1 text-xs md:text-sm text-muted-foreground opacity-50">
                  <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
                </div>
              </>
            )}
            {!isOptimistic && (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setError("返信するにはログインが必要です。");
                    return;
                  }
                  if (!c.id) return;
                  onReplyInputToggle(c.id);
                }}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted md:text-sm"
                aria-label="返信"
              >
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">返信</span>
              </button>
            )}
            {!isOptimistic && (
              <button
                type="button"
                onClick={() => {
                  if (isReportedByMe || !c.id) return;
                  onReportStart(c.id);
                }}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground md:text-sm",
                  isReportedByMe ? "cursor-default opacity-70" : "hover:bg-muted"
                )}
                disabled={isReportedByMe}
                aria-label="通報"
              >
                <Flag className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{isReportedByMe ? "通報済み" : "通報"}</span>
              </button>
            )}
          </div>
          {!isOptimistic && reportingId === c.id && c.id && (
            <div className="mt-1 rounded-lg border bg-muted/50 p-2">
              <p className="mb-2 text-sm font-medium">通報理由</p>
              <select
                aria-label="通報理由"
                value={reportReason}
                onChange={(e) => onReportReasonChange(e.target.value as "spam" | "abuse" | "other")}
                className="mb-2 rounded border bg-background px-2 py-1 text-sm"
              >
                <option value="spam">スパム</option>
                <option value="abuse">誹謗</option>
                <option value="other">その他</option>
              </select>
              <textarea
                placeholder="任意：詳細"
                value={reportMessage}
                onChange={(e) => onReportMessageChange(e.target.value)}
                className="mb-2 w-full rounded border bg-background px-2 py-1 text-sm"
                rows={2}
              />
              {error && (
                <p className="mb-2 text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSubmitReport(c.id)}
                  className="rounded bg-destructive/90 px-3 py-1 text-sm text-destructive-foreground hover:bg-destructive"
                >
                  送信
                </button>
                <button
                  type="button"
                  onClick={onReportCancel}
                  className="rounded border px-3 py-1 text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          {/* 返信（1階層） */}
          {!isOptimistic && (
            <div className="mt-2">
              {/* 返信一覧の開閉ボタン */}
              {c.id && ((c.reply_count && c.reply_count > 0) || (replies[c.id] && replies[c.id]!.length > 0)) ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!c.id) return;
                    onReplyToggle(c.id);
                    if (!replies[c.id] && !replyOpenIds.has(c.id)) {
                      await onLoadReplies(c.id);
                    }
                  }}
                  className="mb-1 text-xs text-muted-foreground underline hover:text-primary"
                >
                  {replyOpenIds.has(c.id)
                    ? "返信を非表示"
                    : `${c.reply_count ?? replies[c.id]?.length ?? 0}件の返信`}
                </button>
              ) : null}
              {/* 返信入力欄 */}
              {c.id && replyInputOpenIds.has(c.id) && user && (
                <div className="mb-2 ml-8 relative">
                  {/* アバターへのL字型の枝（垂直線 + 水平線） */}
                  {/* 上からアバター位置までの垂直線 */}
                  <div className="absolute left-[-16px] top-0 h-3 w-[2px] bg-border/60" />
                  {/* アバター位置からの水平線 */}
                  <div className="absolute left-[-16px] top-3 w-4 h-[2px] bg-border/60" />
                  <textarea
                    placeholder="返信を書く"
                    value={replyBodyById[c.id] ?? ""}
                    onChange={(e) => onReplyBodyChange(c.id, e.target.value)}
                    className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!c.id) return;
                        onReplyInputToggle(c.id);
                        onReplyBodyChange(c.id, "");
                        setError(null);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={() => c.id && onSubmitReply(c.id)}
                      disabled={!replyBodyById[c.id]?.trim()}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      返信
                    </button>
                  </div>
                </div>
              )}
              {/* 返信一覧 */}
              {c.id && replyOpenIds.has(c.id) && (
                <div className="mt-1 ml-8 relative">
                  {(replies[c.id] ?? []).map((r, index) => {
                    const isFirst = index === 0;
                    const isLast = index === (replies[c.id]?.length ?? 0) - 1;
                    return (
                      <div
                        key={r.id}
                        className="relative py-1"
                      >
                        {/* アバター位置から上方向への垂直線（上向きのL字型） */}
                        {/* 最初の返信: アバター位置から上方向へ */}
                        {isFirst && (
                          <div className="absolute left-[-16px] top-0 h-3 w-[2px] bg-border/60" />
                        )}
                        {/* 2番目以降: 前の返信のアバター位置から現在のアバター位置まで（上方向、py-1のパディングを考慮） */}
                        {!isFirst && (
                          <div className="absolute left-[-16px] top-[-60px] h-[72px] w-[2px] bg-border/60" />
                        )}
                        {/* アバター位置からの水平線（L字型の横線部分） */}
                        <div className="absolute left-[-16px] top-3 w-4 h-[2px] bg-border/60" />
                      <div className="flex items-center gap-2 mb-0.5">
                        {r.author_avatar_url && (
                          <img
                            src={r.author_avatar_url}
                            alt=""
                            className="h-6 w-6 shrink-0 rounded-full object-cover"
                            width={24}
                            height={24}
                          />
                        )}
                        <span className="font-medium text-foreground text-xs">
                          {r.author_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleString("ja")}
                        </span>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => onToggleAdminHeartForReply(r.id)}
                            className={cn(
                              "flex items-center gap-0.5 rounded p-0.5 transition-colors hover:bg-muted",
                              r.admin_heart ? "text-primary" : "text-muted-foreground"
                            )}
                            title="管理者ハート"
                            aria-label="管理者ハート"
                          >
                            <Heart className={cn("h-3 w-3", r.admin_heart && "fill-current")} />
                          </button>
                        ) : r.admin_heart ? (
                          <span className="flex items-center gap-0.5 text-primary" title="管理者ハート">
                            <Heart className="h-3 w-3 fill-current" />
                          </span>
                        ) : null}
                      </div>
                      <p className="mb-1 whitespace-pre-wrap text-xs text-foreground">
                        {formatBody(r.body)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleReactionForReply(r.id, "good")}
                          className={cn(
                            "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] md:gap-1",
                            r.my_reaction === "good" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
                          )}
                          aria-label="Good"
                        >
                          <ThumbsUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          <span>{r.good_count}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleReactionForReply(r.id, "not_good")}
                          className={cn(
                            "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] md:gap-1",
                            r.my_reaction === "not_good" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                          )}
                          aria-label="Not Good"
                        >
                          <ThumbsDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        </button>
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
