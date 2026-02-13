import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png",
  "image/gif",
  "image/jpeg",
  "image/webp",
] as const;
const ALLOWED_EXTS = ["png", "gif", "jpg", "jpeg", "webp"] as const;

function getExtFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/gif": "gif",
    "image/jpeg": "jpeg",
    "image/jpg": "jpeg",
    "image/webp": "webp",
  };
  return map[mime] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    if (!adminRow) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const newsId = formData.get("news_id") as string | null;
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "ファイルは10MB以下にしてください" },
        { status: 400 }
      );
    }

    const mime = file.type;
    if (!ALLOWED_TYPES.includes(mime as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: "許可形式: png, gif, jpg, jpeg, webp" },
        { status: 400 }
      );
    }

    const ext = getExtFromMime(mime) ?? "png";
    const name = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTS.some((e) => name.endsWith(`.${e}`));
    if (!hasValidExt) {
      return NextResponse.json(
        { error: "拡張子は png, gif, jpg, jpeg, webp のいずれかにしてください" },
        { status: 400 }
      );
    }

    const admin = createServiceRoleClient();
    const bucket = "public-assets"; // public-assetsバケットを使用
    const buf = Buffer.from(await file.arrayBuffer());

    // パス生成: news/<news_id>/inline-001.png のような形式（public-assetsバケット内のnewsフォルダ）
    // news_idが無い場合は一時的なパスを使用
    const prefix = newsId ? `news/${newsId}` : "news/temp";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `inline-${timestamp}-${random}.${ext}`;
    const path = `${prefix}/${filename}`;

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buf, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "アップロードに失敗しました" },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
    if (!urlData) {
      console.error("Failed to get public URL for path:", path);
      return NextResponse.json(
        { error: "URLの取得に失敗しました" },
        { status: 500 }
      );
    }

    const url = `${urlData.publicUrl}?v=${timestamp}`;

    await admin.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "news.image_upload",
      target_type: "news_image",
      target_id: path,
      meta: { news_id: newsId || null },
    });

    return NextResponse.json({ location: url });
  } catch (error) {
    console.error("Unexpected error in news image upload:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "予期しないエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
