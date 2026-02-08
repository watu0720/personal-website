import { NextRequest, NextResponse } from "next/server";
import { getYouTubePlaylists } from "@/lib/services/youtube";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // 30 min

export async function GET(request: NextRequest) {
  const pageToken = request.nextUrl.searchParams.get("pageToken") ?? undefined;
  try {
    const data = await getYouTubePlaylists(pageToken);
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/youtube/playlists:", e);
    return NextResponse.json(
      { error: "取得できませんでした", items: [] },
      { status: 200 }
    );
  }
}
