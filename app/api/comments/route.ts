import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import {
  isValidPageKey,
  checkBodyLinks,
  getCommentsForPage,
  getReactionCounts,
} from "@/lib/repositories/comments";

const CreateSchema = z.object({
  page_key: z.string().min(1),
  author_type: z.enum(["guest", "user"]),
  guest_name: z.string().min(2).max(20).optional(),
  body: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  const pageKey = req.nextUrl.searchParams.get("page_key");
  if (!pageKey || !isValidPageKey(pageKey)) {
    return NextResponse.json({ error: "Invalid page_key" }, { status: 400 });
  }
  const supabase = await createClient();
  const rows = await getCommentsForPage(supabase, pageKey, { forAdmin: false });
  const commentIds = rows.map((c) => c.id);
  const counts = await getReactionCounts(supabase, commentIds);

  let myReactions: Record<string, "good" | "not_good"> = {};
  const { data: { user } } = await supabase.auth.getUser();
  const fingerprint = req.headers.get("x-fingerprint");
  if ((user || fingerprint) && commentIds.length > 0) {
    let q = supabase.from("comment_reactions").select("comment_id, reaction_type").in("comment_id", commentIds).in("reaction_type", ["good", "not_good"]);
    const { data: r } = user
      ? await q.eq("actor_user_id", user.id)
      : await q.eq("actor_fingerprint", fingerprint!);
    for (const row of r ?? []) {
      const r2 = row as { comment_id: string; reaction_type: string };
      myReactions[r2.comment_id] = r2.reaction_type as "good" | "not_good";
    }
  }

  const list = rows.map((c) => ({
    ...c,
    good_count: counts[c.id]?.good ?? 0,
    not_good_count: counts[c.id]?.not_good ?? 0,
    my_reaction: myReactions[c.id] ?? null,
  }));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const { ok: rateOk } = checkRateLimit("comment", clientId, 5);
  if (!rateOk) {
    return NextResponse.json(
      { error: "投稿が多すぎます。しばらく待ってからお試しください。" },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { page_key, author_type, guest_name, body } = parsed.data;
  if (!isValidPageKey(page_key)) {
    return NextResponse.json({ error: "Invalid page_key" }, { status: 400 });
  }

  const linkCheck = checkBodyLinks(body);
  if (!linkCheck.ok) {
    return NextResponse.json(
      { error: "リンクは http:// または https:// のみ許可されています。" },
      { status: 400 }
    );
  }

  let author_user_id: string | null = null;
  if (author_type === "user") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 }
      );
    }
    author_user_id = user.id;
  } else {
    if (!guest_name?.trim()) {
      return NextResponse.json(
        { error: "ゲストは名前（2〜20文字）が必須です。" },
        { status: 400 }
      );
    }
  }

  const admin = createServiceRoleClient();
  const { data: comment, error } = await admin
    .from("comments")
    .insert({
      page_key,
      author_type,
      author_user_id: author_type === "user" ? author_user_id : null,
      guest_name: author_type === "guest" ? guest_name!.trim() : null,
      body: body.trim(),
      body_has_links: linkCheck.hasLinks,
      is_hidden: false,
      hidden_reason: null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(comment);
}
