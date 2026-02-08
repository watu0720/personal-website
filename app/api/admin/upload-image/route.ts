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

  const type = formData.get("type") as string | null;
  const file = formData.get("file") as File | null;
  if (!type || !file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "type and file are required" },
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
  const bucket = "public-assets";
  const buf = Buffer.from(await file.arrayBuffer());

  if (type === "profile") {
    const path = `avatars/profile.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buf, {
        contentType: mime,
        upsert: true,
      });
    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "アップロードに失敗しました" },
        { status: 500 }
      );
    }
    const { data: firstAdmin } = await admin
      .from("admin_roles")
      .select("user_id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (firstAdmin?.user_id) {
      await admin.from("profiles").upsert(
        {
          user_id: firstAdmin.user_id,
          avatar_path: path,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
    await admin.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "asset.update",
      target_type: "profile_avatar",
      target_id: path,
      meta: {},
    });
    return NextResponse.json({ ok: true, path, url: urlData.publicUrl });
  }

  if (type === "header") {
    const path = `headers/home.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buf, {
        contentType: mime,
        upsert: true,
      });
    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "アップロードに失敗しました" },
        { status: 500 }
      );
    }
    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
    const ts = new Date().toISOString();
    await admin
      .from("page_contents")
      .update({
        header_image_url: `${urlData.publicUrl}?v=${Date.now()}`,
        updated_at: ts,
        updated_by: user.id,
      })
      .eq("page_key", "home");
    await admin.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "asset.update",
      target_type: "header_image",
      target_id: "home",
      meta: {},
    });
    return NextResponse.json({ ok: true, path, url: urlData.publicUrl });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
