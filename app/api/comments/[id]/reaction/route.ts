import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const BodySchema = z.object({
  reaction_type: z.enum(["good", "not_good"]),
  fingerprint: z.string().optional(), // guest
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const clientId = getClientId(req.headers);
  const { ok: rateOk } = checkRateLimit("reaction", `${clientId}:${commentId}`, 10);
  if (!rateOk) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { reaction_type, fingerprint } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let actor_type: "guest" | "user";
  let actor_user_id: string | null = null;
  let actor_fingerprint: string | null = null;

  if (user) {
    actor_type = "user";
    actor_user_id = user.id;
  } else {
    actor_type = "guest";
    actor_fingerprint = fingerprint || `guest-${clientId}`;
  }

  const admin = createServiceRoleClient();

  // Check existing: one per (comment, type, user/fingerprint)
  let existingRow: { id: string } | null = null;
  if (actor_user_id) {
    const { data } = await admin
      .from("comment_reactions")
      .select("id")
      .eq("comment_id", commentId)
      .eq("reaction_type", reaction_type)
      .eq("actor_user_id", actor_user_id)
      .maybeSingle();
    existingRow = data;
  } else {
    const { data } = await admin
      .from("comment_reactions")
      .select("id")
      .eq("comment_id", commentId)
      .eq("reaction_type", reaction_type)
      .eq("actor_fingerprint", actor_fingerprint)
      .maybeSingle();
    existingRow = data;
  }

  if (existingRow) {
    await admin.from("comment_reactions").delete().eq("id", existingRow.id);
    return NextResponse.json({ action: "removed" });
  }

  // Remove opposite if any (good vs not_good)
  const opposite = reaction_type === "good" ? "not_good" : "good";
  if (actor_user_id) {
    await admin.from("comment_reactions").delete().match({
      comment_id: commentId,
      reaction_type: opposite,
      actor_user_id,
    });
  } else {
    await admin.from("comment_reactions").delete().match({
      comment_id: commentId,
      reaction_type: opposite,
      actor_fingerprint,
    });
  }

  await admin.from("comment_reactions").insert({
    comment_id: commentId,
    reaction_type,
    actor_type,
    actor_user_id,
    actor_fingerprint,
  });
  return NextResponse.json({ action: "added" });
}
