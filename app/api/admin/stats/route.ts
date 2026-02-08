import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getVisitStats, getPageRanking } from "@/lib/repositories/visits";

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabase.from("admin_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const admin = createServiceRoleClient();
    const now = new Date();
    const today = dateString(now);
    const yesterday = dateString(addDays(now, -1));
    const sevenDaysAgo = dateString(addDays(now, -6));
    const thirtyDaysAgo = dateString(addDays(now, -29));

    const [todayStats, yesterdayStats, last7Stats, last30Stats, rankPv, rankUnique] = await Promise.all([
      getVisitStats(admin, today, today),
      getVisitStats(admin, yesterday, yesterday),
      getVisitStats(admin, sevenDaysAgo, today),
      getVisitStats(admin, thirtyDaysAgo, today),
      getPageRanking(admin, thirtyDaysAgo, today),
      getPageRanking(admin, thirtyDaysAgo, today),
    ]);

    const pageRankingPv = rankPv.sort((a, b) => b.pv - a.pv);
    const pageRankingUnique = rankUnique.sort((a, b) => b.unique - a.unique);

    return NextResponse.json({
      today: todayStats,
      yesterday: yesterdayStats,
      last7: last7Stats,
      last30: last30Stats,
      pageRankingPv: pageRankingPv.slice(0, 10),
      pageRankingUnique: pageRankingUnique.slice(0, 10),
    });
  } catch (e) {
    console.error("GET /api/admin/stats:", e);
    return NextResponse.json(
      {
        today: { pv: 0, unique: 0 },
        yesterday: { pv: 0, unique: 0 },
        last7: { pv: 0, unique: 0 },
        last30: { pv: 0, unique: 0 },
        pageRankingPv: [],
        pageRankingUnique: [],
      },
      { status: 200 }
    );
  }
}
