import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("news_posts")
    .select("tags")
    .eq("status", "published")
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tagSet = new Set<string>();
  for (const row of data ?? []) {
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        if (typeof tag === "string" && tag.trim()) {
          tagSet.add(tag.trim());
        }
      }
    }
  }

  return NextResponse.json(Array.from(tagSet).sort());
}
