import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
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

  try {
    const admin = createServiceRoleClient();
    // メインプロフィール（avatars/profile.*形式）を取得
    const { data, error } = await admin
      .from("profiles")
      .select("avatar_path")
      .like("avatar_path", "avatars/profile.%")
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      avatar_path: data?.avatar_path ?? null,
    });
  } catch (e) {
    console.error("GET /api/admin/profiles/avatar:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}
