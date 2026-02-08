import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const BodySchema = z.object({
  comment_id: z.string().uuid(),
  reason: z.enum(["spam", "abuse", "other"]),
  message: z.string().max(500).optional(),
  fingerprint: z.string().optional(),
});

const AUTO_HIDE_THRESHOLD = 3;

export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const { ok: rateOk } = checkRateLimit("report", clientId, 3);
  if (!rateOk) {
    return NextResponse.json(
      { error: "通報が多すぎます。しばらく待ってからお試しください。" },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { comment_id, reason, message, fingerprint } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let reporter_type: "guest" | "user";
  let reporter_user_id: string | null = null;
  let guest_fingerprint: string | null = null;

  if (user) {
    reporter_type = "user";
    reporter_user_id = user.id;
  } else {
    reporter_type = "guest";
    guest_fingerprint = fingerprint || `guest-${clientId}`;
  }

  const admin = createServiceRoleClient();

  const { error: insertError } = await admin.from("comment_reports").insert({
    comment_id,
    reporter_type,
    reporter_user_id,
    guest_fingerprint,
    reason,
    message: message?.trim() ?? null,
    resolved: false,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "このコメントは既に通報済みです。" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { count, error: countErr } = await admin
    .from("comment_reports")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", comment_id);
  if (!countErr && (count ?? 0) >= AUTO_HIDE_THRESHOLD) {
    await admin
      .from("comments")
      .update({
        is_hidden: true,
        hidden_reason: "reported",
        updated_at: new Date().toISOString(),
      })
      .eq("id", comment_id);
  }

  return NextResponse.json({ ok: true });
}
