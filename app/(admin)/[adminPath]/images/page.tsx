"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const ImageCropModal = dynamic(
  () =>
    import("@/components/admin/image-crop-modal").then((m) => m.ImageCropModal),
  { ssr: false }
);

type CropState = {
  open: boolean;
  imageSrc: string;
  cropType: "profile" | "header";
  fileName: string;
};

export default function AdminImagesPage() {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [crop, setCrop] = useState<CropState>({
    open: false,
    imageSrc: "",
    cropType: "profile",
    fileName: "",
  });
  const profileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

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
    setMessage(null);
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
      setMessage({ type: "ok", text: "アップロードしました。表示を更新してください。" });
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
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold text-foreground">画像管理</h1>
      {message && (
        <p
          className={`mb-4 text-sm ${
            message.type === "ok"
              ? "text-green-600 dark:text-green-400"
              : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="space-y-8">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 font-semibold text-foreground">プロフィール画像</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            プロフィール画面に表示されます。10MBまで、png/gif/jpg/jpeg/webp。
          </p>
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
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "ファイルを選択してアップロード"}
          </button>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 font-semibold text-foreground">ヘッダー画像（Homeヒーロー）</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Home画面のヒーローに表示されます。10MBまで、png/gif/jpg/jpeg/webp。
          </p>
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
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "ファイルを選択してアップロード"}
          </button>
        </section>
      </div>

      <ImageCropModal
        open={crop.open}
        imageSrc={crop.imageSrc}
        cropType={crop.cropType}
        onConfirm={handleCropConfirm}
        onCancel={closeCropModal}
      />
    </div>
  );
}
