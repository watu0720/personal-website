"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Upload, X, Calendar, Tag } from "lucide-react";
import { NewsBody } from "@/components/news-body";

const ImageCropModal = dynamic(
  () =>
    import("@/components/admin/image-crop-modal").then((m) => m.ImageCropModal),
  { ssr: false }
);

// TinyMCEのHydrationエラーを防ぐため、SSRを無効化
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false }
);

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

export function AdminNewsEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? "";
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailCrop, setThumbnailCrop] = useState<{
    open: boolean;
    imageSrc: string;
    fileName: string;
  }>({
    open: false,
    imageSrc: "",
    fileName: "",
  });
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // searchParamsからidを取得（useEffect内で実行）
  useEffect(() => {
    const postId = searchParams.get("id");
    setId(postId);
  }, [searchParams]);

  const fetchPost = useCallback(async () => {
    if (!id) {
      // 新規作成の場合は初期値を設定
      setTitle("");
      setBodyHtml("");
      setThumbnailUrl("");
      setTags([]);
      setStatus("draft");
      setPublishedAt("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const post: NewsPost = await res.json();
        setTitle(post.title);
        setBodyHtml(post.body_html);
        setThumbnailUrl(post.thumbnail_url || "");
        setTags([...post.tags]);
        setStatus(post.status);
        setPublishedAt(post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : "");
      } else {
        setMessage({ type: "error", text: "お知らせの読み込みに失敗しました" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "お知らせの読み込みに失敗しました" });
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const fetchAllTags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/news/tags");
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (id !== null) {
      // idが設定されたらデータを取得
      fetchPost();
    }
  }, [id, fetchPost]);

  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function savePost() {
    if (!title.trim()) {
      setMessage({ type: "error", text: "タイトルを入力してください" });
      return;
    }
    if (!bodyHtml.trim()) {
      setMessage({ type: "error", text: "本文を入力してください" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setMessage({ type: "error", text: "ログインし直してください" });
        return;
      }

      const url = id ? `/api/admin/news/${id}` : "/api/admin/news";
      const payload: {
        title: string;
        body_html: string;
        thumbnail_url?: string;
        tags: string[];
        status: "draft" | "published";
        published_at?: string;
      } = {
        title: title.trim(),
        body_html: bodyHtml,
        tags,
        status,
      };

      if (thumbnailUrl.trim()) {
        payload.thumbnail_url = thumbnailUrl.trim();
      }

      if (status === "published" && publishedAt.trim()) {
        payload.published_at = new Date(publishedAt).toISOString();
      }

      const res = await fetch(url, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? "保存に失敗しました" });
        return;
      }

      setMessage({ type: "ok", text: id ? "保存しました" : "作成しました" });
      // 一覧ページに戻る
      setTimeout(() => {
        router.push("../news");
      }, 1000);
    } catch (error) {
      setMessage({ type: "error", text: "保存に失敗しました" });
    } finally {
      setSaving(false);
    }
  }

  function handleThumbnailFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target?.result as string;
      setThumbnailCrop({
        open: true,
        imageSrc,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  function closeThumbnailCropModal() {
    setThumbnailCrop({ open: false, imageSrc: "", fileName: "" });
  }

  async function handleThumbnailCropConfirm(croppedImageBlob: Blob) {
    setThumbnailUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setMessage({ type: "error", text: "ログインし直してください" });
        return;
      }

      const formData = new FormData();
      formData.append("file", croppedImageBlob, "thumbnail.png");
      formData.append("type", "news-thumbnail");
      if (id) {
        formData.append("news_id", id);
      }

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const out = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: out?.error ?? "サムネイルのアップロードに失敗しました",
        });
        return;
      }
      setThumbnailUrl(out.url || "");
      setMessage({ type: "ok", text: "サムネイルをアップロードしました" });
    } catch {
      setMessage({ type: "error", text: "サムネイルのアップロードに失敗しました" });
    } finally {
      setThumbnailUploading(false);
      closeThumbnailCropModal();
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center gap-4 md:mb-6">
        <Link
          href="../news"
          className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted md:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Link>
        <h1 className="text-lg font-bold text-foreground md:text-xl">
          {id ? "お知らせ編集" : "お知らせ新規作成"}
        </h1>
      </div>

      <div className="rounded-lg border bg-card p-4 md:p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium md:text-sm">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
              placeholder="お知らせのタイトル"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium md:text-sm">本文</label>
            <RichTextEditor
              apiKey={apiKey}
              value={bodyHtml}
              onChange={setBodyHtml}
              newsId={id || null}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium md:text-sm">サムネイル</label>
            <div className="space-y-2">
              {thumbnailUrl && (
                <div className="relative inline-block">
                  <img
                    src={thumbnailUrl}
                    alt="サムネイルプレビュー"
                    className="h-24 w-40 rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl("")}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
                    title="サムネイルを削除"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept=".png,.gif,.jpg,.jpeg,.webp,image/png,image/gif,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleThumbnailFileSelect}
                  disabled={thumbnailUploading}
                  aria-label="サムネイル画像を選択"
                  title="サムネイル画像を選択"
                />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={thumbnailUploading}
                  className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50 md:text-sm"
                >
                  <Upload className="h-3 w-3 md:h-4 md:w-4" />
                  {thumbnailUploading ? "アップロード中..." : "画像を選択"}
                </button>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
                  placeholder="またはURLを直接入力"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium md:text-sm">タグ</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
                placeholder="タグを入力してEnter"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
              >
                追加
              </button>
            </div>
            {allTags.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-muted-foreground">候補:</p>
                <div className="flex flex-wrap gap-1">
                  {allTags
                    .filter((t) => !tags.includes(t))
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!tags.includes(tag)) {
                            setTags([...tags, tag]);
                          }
                        }}
                        className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="status-select" className="mb-1 block text-xs font-medium md:text-sm">
              公開状態
            </label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
              aria-label="公開状態"
            >
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
          </div>

          <div>
            <label htmlFor="published-at-input" className="mb-1 block text-xs font-medium md:text-sm">
              公開日時（任意）
            </label>
            <input
              id="published-at-input"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm"
              aria-label="公開日時（任意）"
              title="公開日時（任意）"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs md:text-sm"
            >
              プレビュー
            </button>
            <button
              type="button"
              onClick={savePost}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 md:text-sm"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <Link
              href="../news"
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs md:text-sm text-center"
            >
              キャンセル
            </Link>
          </div>

          {message && (
            <p
              className={
                message.type === "ok"
                  ? "text-xs text-green-600 dark:text-green-400 md:text-sm"
                  : "text-xs text-destructive md:text-sm"
              }
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      <ImageCropModal
        open={thumbnailCrop.open}
        imageSrc={thumbnailCrop.imageSrc}
        cropType="thumbnail"
        onConfirm={handleThumbnailCropConfirm}
        onCancel={closeThumbnailCropModal}
      />

      {/* プレビューモーダル */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-xl">
            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-muted transition-colors"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>

            {/* プレビューコンテンツ */}
            <div className="p-4 sm:p-6 md:p-8 md:py-12">
              {/* パンくずリスト */}
              <div className="mb-3 md:mb-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Link href="/news" className="hover:text-primary transition-colors">
                  お知らせ一覧
                </Link>
                <span>/</span>
                <span className="text-foreground">{title || "タイトル未設定"}</span>
              </div>

              {/* サムネイル（タイトルオーバーレイ付き） */}
              {thumbnailUrl ? (
                <div className="mb-4 md:mb-6 relative w-full rounded-xl sm:rounded-2xl overflow-hidden">
                  <img
                    src={thumbnailUrl}
                    alt={title || "サムネイル"}
                    className="w-full h-auto object-cover"
                  />
                  {/* タイトルとメタ情報のオーバーレイ（帯付き） */}
                  <div className="absolute bottom-0 left-0 right-0">
                    {/* 半透明の帯 */}
                    <div className="bg-gradient-to-t from-black/70 via-black/60 to-black/50 backdrop-blur-sm p-4 sm:p-6 md:p-8">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words">
                          {title || "タイトル未設定"}
                        </h1>
                        {publishedAt && new Date(publishedAt) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-lg">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white">
                        {publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              {new Date(publishedAt).toLocaleDateString("ja-JP", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* タイトル（サムネイルがない場合） */}
                  <div className="mb-3 md:mb-4 flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary break-words">
                      {title || "タイトル未設定"}
                    </h1>
                    {publishedAt && new Date(publishedAt) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        NEW
                      </span>
                    )}
                  </div>
                  {/* 日付とタグ（サムネイルがない場合） */}
                  <div className="mb-4 md:mb-6 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>
                          {new Date(publishedAt).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-muted px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 本文 */}
              <div className="mb-6 md:mb-8">
                <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 md:p-8">
                  <NewsBody html={bodyHtml || "<p>本文がありません</p>"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
