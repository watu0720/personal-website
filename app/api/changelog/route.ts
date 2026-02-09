import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChangelog } from "@/lib/repositories/changelog";

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : undefined;
  const supabase = await createClient();
  const rows = await getChangelog(supabase, { limit });
  return NextResponse.json(rows);
}
