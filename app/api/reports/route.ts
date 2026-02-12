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

// 現在の閲覧者が通報済みのコメントID一覧を返す
export async function GET(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("comment_ids");
  if (!idsParam) {
    return NextResponse.json({ error: "comment_ids is required" }, { status: 400 });
  }
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (ids.length === 0) {
    return NextResponse.json({ reportedIds: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fingerprintHeader = req.headers.get("x-fingerprint") ?? undefined;

  const admin = createServiceRoleClient();
  let query = admin.from("comment_reports").select("comment_id");

  if (user) {
    query = query.eq("reporter_user_id", user.id);
  } else {
    const guestFingerprint = fingerprintHeader || `guest-${clientId}`;
    query = query.eq("guest_fingerprint", guestFingerprint);
  }

  const { data, error } = await query.in("comment_id", ids);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reportedIds = Array.from(
    new Set((data ?? []).map((row) => (row as { comment_id: string }).comment_id))
  );
  return NextResponse.json({ reportedIds });
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
