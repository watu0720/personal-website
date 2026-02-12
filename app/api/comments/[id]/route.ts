import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { verifyEditToken } from "@/lib/edit-token";
import { checkBodyLinks } from "@/lib/repositories/comments";

const UpdateSchema = z.object({
  body: z.string().min(1).max(2000),
  edit_token: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { body: newBody, edit_token } = parsed.data;
  const linkCheck = checkBodyLinks(newBody.trim());
  if (!linkCheck.ok) {
    const message =
      !linkCheck.hasLinks
        ? "本文が不正です。"
        : linkCheck.linkCount > 2
        ? "リンクは1つのコメントにつき最大2件までです。"
        : "リンクは http:// または https:// のみ許可されています。";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();
  const { data: comment, error: fetchError } = await admin
    .from("comments")
    .select("id, author_type, author_user_id, edit_token_hash")
    .eq("id", id)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json(
      { error: "コメントが見つかりません。" },
      { status: 404 }
    );
  }

  const c = comment as {
    id: string;
    author_type: string;
    author_user_id: string | null;
    edit_token_hash: string | null;
  };

  if (c.author_type === "user") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== c.author_user_id) {
      return NextResponse.json(
        { error: "このコメントを編集する権限がありません。" },
        { status: 403 }
      );
    }
  } else if (c.author_type === "guest") {
    if (!edit_token || !verifyEditToken(edit_token, c.edit_token_hash)) {
      return NextResponse.json(
        { error: "編集トークンが無効です。このコメントを編集する権限がありません。" },
        { status: 403 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "編集できません。" },
      { status: 403 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("comments")
    .update({
      body: newBody.trim(),
      body_has_links: linkCheck.hasLinks,
      edited_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json(updated);
}
