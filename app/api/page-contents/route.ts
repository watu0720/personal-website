import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const pageKey = req.nextUrl.searchParams.get("page_key");
  if (!pageKey) {
    return NextResponse.json(
      { error: "page_key is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_contents")
    .select("page_key, title, body_html, header_image_url, updated_at, updated_by")
    .eq("page_key", pageKey)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
