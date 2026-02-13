import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const provider = typeof body.provider === "string" ? body.provider : null;

  const admin = createServiceRoleClient();
  const results: Array<{ provider: string; success: boolean; error?: string }> = [];

  try {
    // external_cacheテーブルから該当するキャッシュを削除
    if (!provider || provider === "youtube") {
      await admin
        .from("external_cache")
        .delete()
        .eq("provider", "youtube");
      revalidatePath("/");
      results.push({ provider: "youtube", success: true });
    }

    if (!provider || provider === "niconico") {
      await admin
        .from("external_cache")
        .delete()
        .eq("provider", "niconico");
      revalidatePath("/");
      results.push({ provider: "niconico", success: true });
    }

    if (!provider || provider === "github") {
      await admin
        .from("external_cache")
        .delete()
        .eq("provider", "github");
      revalidatePath("/");
      results.push({ provider: "github", success: true });
    }

    await admin.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "external_api.refresh",
      target_type: "external_cache",
      target_id: provider || "all",
      meta: { results },
    });

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
