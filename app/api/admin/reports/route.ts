import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolved = req.nextUrl.searchParams.get("resolved"); // true | false
  const admin = createServiceRoleClient();
  let q = admin.from("comment_reports").select("*, comments(page_key, body, is_hidden, hidden_reason)").order("created_at", { ascending: false });
  if (resolved === "true") q = q.eq("resolved", true);
  else if (resolved === "false") q = q.eq("resolved", false);
  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rows ?? []);
}
