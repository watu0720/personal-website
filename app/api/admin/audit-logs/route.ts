import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const action = req.nextUrl.searchParams.get("action");
  const actor = req.nextUrl.searchParams.get("actor_user_id");
  const from = req.nextUrl.searchParams.get("from"); // ISO date
  const to = req.nextUrl.searchParams.get("to");

  const admin = createServiceRoleClient();
  let q = admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (action) q = q.eq("action", action);
  if (actor) q = q.eq("actor_user_id", actor);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);
  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rows ?? []);
}
