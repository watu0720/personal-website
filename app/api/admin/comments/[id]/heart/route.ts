import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: commentId } = await params;
  const admin = createServiceRoleClient();

  const { data: comment } = await admin.from("comments").select("admin_heart").eq("id", commentId).single();
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextHeart = !(comment as { admin_heart: boolean }).admin_heart;
  await admin.from("comments").update({
    admin_heart: nextHeart,
    admin_heart_by: nextHeart ? user.id : null,
    admin_heart_at: nextHeart ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", commentId);

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "comment.heart",
    target_type: "comments",
    target_id: commentId,
    meta: { on: nextHeart },
  });
  return NextResponse.json({ ok: true, admin_heart: nextHeart });
}
