import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createServiceRoleClient();
  const { data, error } = await admin.from("changelog").select("*").order("published_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const title = typeof json?.title === "string" ? json.title.trim() : "";
  const body_html = typeof json?.body_html === "string" ? json.body_html : "";
  if (!title || !body_html) {
    return NextResponse.json({ error: "title と body_html は必須です。" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.from("changelog").insert({
    title,
    body_html,
    published_at: new Date().toISOString(),
    created_by: user.id,
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
