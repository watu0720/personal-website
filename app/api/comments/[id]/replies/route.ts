import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkBodyLinks, getRepliesForComments, getReactionCounts } from "@/lib/repositories/comments";

const CreateReplySchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const map = await getRepliesForComments(supabase, [id]);
  const replies = map[id] ?? [];
  
  // 返信のリアクション数を取得
  const replyIds = replies.map((r) => r.id);
  const reactionCounts = await getReactionCounts(supabase, replyIds);
  
  // 現在のユーザーのリアクション状態を取得
  const { data: { user } } = await supabase.auth.getUser();
  const fingerprint = req.headers.get("x-fingerprint");
  let myReactions: Record<string, "good" | "not_good"> = {};
  if ((user || fingerprint) && replyIds.length > 0) {
    let q = supabase
      .from("comment_reactions")
      .select("comment_id, reaction_type")
      .in("comment_id", replyIds)
      .in("reaction_type", ["good", "not_good"]);
    const { data: r } = user
      ? await q.eq("actor_user_id", user.id)
      : await q.eq("actor_fingerprint", fingerprint!);
    for (const row of r ?? []) {
      const r2 = row as { comment_id: string; reaction_type: string };
      myReactions[r2.comment_id] = r2.reaction_type as "good" | "not_good";
    }
  }
  
  // 管理者ハートの状態を取得
  const { data: adminHeartRows } = await supabase
    .from("comment_replies")
    .select("id, admin_heart")
    .in("id", replyIds);
  const adminHearts: Record<string, boolean> = {};
  for (const row of adminHeartRows ?? []) {
    adminHearts[row.id] = row.admin_heart ?? false;
  }
  
  const result = replies.map((r) => ({
    ...r,
    good_count: reactionCounts[r.id]?.good ?? 0,
    not_good_count: reactionCounts[r.id]?.not_good ?? 0,
    my_reaction: myReactions[r.id] ?? null,
    admin_heart: adminHearts[r.id] ?? false,
  }));
  
  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: parentId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = CreateReplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { body } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "ログインが必要です。（返信）" },
      { status: 401 }
    );
  }

  // ensure parent exists and is not deleted
  const { data: parent } = await supabase
    .from("comments")
    .select("id, page_key, hidden_reason")
    .eq("id", parentId)
    .maybeSingle();
  if (!parent || parent.hidden_reason === "deleted") {
    return NextResponse.json(
      { error: "返信元のコメントが見つかりません。" },
      { status: 404 }
    );
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    ((meta.full_name ?? meta.name ?? user.email) as string | undefined)
      ?.trim() ?? "ユーザー";
  const avatarUrl =
    (meta.avatar_url as string | undefined)?.trim() || null;

  const admin = createServiceRoleClient();
  const linkCheck = checkBodyLinks(body.trim());
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
  const { data: inserted, error } = await admin
    .from("comment_replies")
    .insert({
      parent_comment_id: parentId,
      page_key: parent.page_key as string,
      author_user_id: user.id,
      author_name: name,
      author_avatar_url: avatarUrl,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(inserted);
}

