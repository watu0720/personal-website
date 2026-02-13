"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { getPublicAssetUrl } from "@/lib/storage-url";

// TinyMCEのHydrationエラーを防ぐため、SSRを無効化
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false }
);

const ImageCropModal = dynamic(
  () =>
    import("@/components/admin/image-crop-modal").then((m) => m.ImageCropModal),
  { ssr: false }
);

const PAGES = [
  { key: "home", label: "ホーム" },
  { key: "profile", label: "プロフィール" },
  { key: "youtube", label: "YouTube" },
  { key: "niconico", label: "ニコニコ" },
  { key: "dev", label: "個人開発" },
] as const;

type CropState = {
  open: boolean;
  imageSrc: string;
  cropType: "profile" | "header";
  fileName: string;
};

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
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop] = useState<CropState>({
    open: false,
    imageSrc: "",
    cropType: "profile",
    fileName: "",
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

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
      // ヘッダー画像URLを設定（ホームページの場合）
      if (pageKey === "home") {
        setHeaderImageUrl(data.header_image_url ?? null);
      }
    })();
  }, [pageKey]);

  // プロフィール画像URLを取得（プロフィールページの場合）
  useEffect(() => {
    if (pageKey === "profile") {
      (async () => {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/admin/profiles/avatar", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.avatar_path) {
            setProfileImageUrl(getPublicAssetUrl(data.avatar_path, Date.now().toString()));
          } else {
            setProfileImageUrl(null);
          }
        }
      })();
    }
  }, [pageKey, supabase.auth]);

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

  const closeCropModal = useCallback(() => {
    if (crop.imageSrc) URL.revokeObjectURL(crop.imageSrc);
    setCrop((prev) => ({ ...prev, open: false, imageSrc: "" }));
    profileInputRef.current && (profileInputRef.current.value = "");
    headerInputRef.current && (headerInputRef.current.value = "");
  }, [crop.imageSrc]);

  async function doUpload(file: File, uploadType: "profile" | "header") {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      setMessage({ type: "error", text: "ログインし直してください。" });
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.set("type", uploadType);
    form.set("file", file);
    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const out = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: out?.error ?? "アップロードに失敗しました",
        });
        return;
      }
      setMessage({ type: "ok", text: "画像をアップロードしました。表示を更新してください。" });
      // アップロード後に画像URLを更新
      if (uploadType === "profile") {
        // プロフィール画像URLを再取得
        const { data: sessData } = await supabase.auth.getSession();
        const token2 = sessData?.session?.access_token;
        if (token2) {
          const res2 = await fetch("/api/admin/profiles/avatar", {
            headers: { Authorization: `Bearer ${token2}` },
          });
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.avatar_path) {
              setProfileImageUrl(getPublicAssetUrl(data2.avatar_path, Date.now().toString()));
            }
          }
        }
      } else if (uploadType === "header") {
        // ヘッダー画像URLを再取得
        const res2 = await fetch(`/api/page-contents?page_key=home`);
        if (res2.ok) {
          const data2 = await res2.json();
          setHeaderImageUrl(data2.header_image_url ?? null);
        }
      }
    } catch {
      setMessage({ type: "error", text: "アップロードに失敗しました" });
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    uploadType: "profile" | "header"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageSrc = URL.createObjectURL(file);
    setCrop({
      open: true,
      imageSrc,
      cropType: uploadType,
      fileName: file.name.replace(/\.[^.]+$/, ".jpg") || "image.jpg",
    });
  }

  async function handleCropConfirm(blob: Blob) {
    const file = new File([blob], crop.fileName, { type: blob.type });
    closeCropModal();
    await doUpload(file, crop.cropType);
  }

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

      {/* プロフィール画像アップロード（プロフィール編集時） */}
      {pageKey === "profile" && (
        <section className="mb-6 rounded-xl border bg-card p-4 md:p-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground md:text-base">プロフィール画像</h2>
          <p className="mb-4 text-xs text-muted-foreground md:text-sm">
            プロフィール画面に表示されます。10MBまで、png/gif/jpg/jpeg/webp。
          </p>
          {profileImageUrl && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-foreground md:text-sm">現在の画像</p>
              <div className="relative inline-block">
                <img
                  src={profileImageUrl}
                  alt="プロフィール画像プレビュー"
                  className="h-32 w-32 rounded-full object-cover border-2 border-border md:h-40 md:w-40"
                />
              </div>
            </div>
          )}
          <input
            ref={profileInputRef}
            type="file"
            accept=".png,.gif,.jpg,.jpeg,.webp,image/png,image/gif,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "profile")}
            disabled={uploading}
            aria-label="プロフィール画像を選択"
            title="プロフィール画像を選択"
          />
          <button
            type="button"
            onClick={() => profileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 md:w-auto md:text-sm"
          >
            {uploading ? "アップロード中..." : "ファイルを選択してアップロード"}
          </button>
        </section>
      )}

      {/* ヘッダー画像アップロード（ホーム編集時） */}
      {pageKey === "home" && (
        <section className="mb-6 rounded-xl border bg-card p-4 md:p-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground md:text-base">ヘッダー画像（Homeヒーロー）</h2>
          <p className="mb-4 text-xs text-muted-foreground md:text-sm">
            Home画面のヒーローに表示されます。10MBまで、png/gif/jpg/jpeg/webp。
          </p>
          {headerImageUrl && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-foreground md:text-sm">現在の画像</p>
              <div className="relative inline-block max-w-full">
                <img
                  src={headerImageUrl}
                  alt="ヘッダー画像プレビュー"
                  className="max-h-64 w-auto rounded-lg border-2 border-border object-contain md:max-h-80"
                />
              </div>
            </div>
          )}
          <input
            ref={headerInputRef}
            type="file"
            accept=".png,.gif,.jpg,.jpeg,.webp,image/png,image/gif,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "header")}
            disabled={uploading}
            aria-label="ヘッダー画像を選択"
            title="ヘッダー画像を選択"
          />
          <button
            type="button"
            onClick={() => headerInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 md:w-auto md:text-sm"
          >
            {uploading ? "アップロード中..." : "ファイルを選択してアップロード"}
          </button>
        </section>
      )}

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

      <ImageCropModal
        open={crop.open}
        imageSrc={crop.imageSrc}
        cropType={crop.cropType}
        onConfirm={handleCropConfirm}
        onCancel={closeCropModal}
      />
    </>
  );
}
