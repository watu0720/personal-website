import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getCommentsForPage, getReactionCounts, getReportCounts } from "@/lib/repositories/comments";
import { isValidPageKey } from "@/lib/repositories/comments";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pageKey = req.nextUrl.searchParams.get("page_key");
  const state = req.nextUrl.searchParams.get("state"); // visible | hidden | reported | deleted
  const authorType = req.nextUrl.searchParams.get("author_type"); // user | guest

  const admin = createServiceRoleClient();
  let rows: Awaited<ReturnType<typeof getCommentsForPage>>;
  if (pageKey && isValidPageKey(pageKey)) {
    rows = await getCommentsForPage(admin, pageKey, { forAdmin: true });
  } else {
    const allKeys = ["home", "profile", "youtube", "niconico", "dev"];
    const all: Awaited<ReturnType<typeof getCommentsForPage>> = [];
    for (const key of allKeys) {
      const r = await getCommentsForPage(admin, key, { forAdmin: true });
      all.push(...r);
    }
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    rows = all;
  }

  if (state) {
    if (state === "visible") rows = rows.filter((c) => !c.is_hidden);
    else if (state === "hidden") rows = rows.filter((c) => c.is_hidden && c.hidden_reason === "admin");
    else if (state === "reported") rows = rows.filter((c) => c.is_hidden && c.hidden_reason === "reported");
    else if (state === "deleted") rows = rows.filter((c) => c.is_hidden && c.hidden_reason === "deleted");
  }
  if (authorType) {
    if (authorType === "user") rows = rows.filter((c) => c.author_type === "user");
    else if (authorType === "guest") rows = rows.filter((c) => c.author_type === "guest");
  }

  const commentIds = rows.map((c) => c.id);
  const [counts, reportCounts] = await Promise.all([
    getReactionCounts(admin, commentIds),
    getReportCounts(admin, commentIds),
  ]);

  const list = rows.map((c) => ({
    ...c,
    good_count: counts[c.id]?.good ?? 0,
    not_good_count: counts[c.id]?.not_good ?? 0,
    report_count: reportCounts[c.id] ?? 0,
  }));
  return NextResponse.json(list);
}
