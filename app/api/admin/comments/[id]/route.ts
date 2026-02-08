import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const action = json.action as string; // hide | unhide | delete

  const admin = createServiceRoleClient();
  if (action === "hide") {
    await admin.from("comments").update({ is_hidden: true, hidden_reason: "admin", updated_at: new Date().toISOString() }).eq("id", id);
    await admin.from("audit_logs").insert({ actor_user_id: user.id, action: "comment.hide", target_type: "comments", target_id: id, meta: {} });
    return NextResponse.json({ ok: true });
  }
  if (action === "unhide") {
    await admin.from("comments").update({ is_hidden: false, hidden_reason: null, updated_at: new Date().toISOString() }).eq("id", id);
    await admin.from("audit_logs").insert({ actor_user_id: user.id, action: "comment.unhide", target_type: "comments", target_id: id, meta: {} });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await admin.from("comments").update({ is_hidden: true, hidden_reason: "deleted", updated_at: new Date().toISOString() }).eq("id", id);
    await admin.from("audit_logs").insert({ actor_user_id: user.id, action: "comment.delete", target_type: "comments", target_id: id, meta: {} });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
