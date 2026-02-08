import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sanitizeRichText } from "@/lib/sanitize";

const BodySchema = z.object({
  page_key: z.string().min(1).max(50),
  title: z.string().max(200),
  body_html: z.string(),
});

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

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { page_key, title, body_html } = parsed.data;
  const safeHtml = sanitizeRichText(body_html);
  const admin = createServiceRoleClient();

  const { error: updateError } = await admin
    .from("page_contents")
    .update({
      title,
      body_html: safeHtml,
      updated_by: user.id,
    })
    .eq("page_key", page_key);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "page.update",
    target_type: "page_contents",
    target_id: page_key,
    meta: {},
  });

  return NextResponse.json({ ok: true });
}
