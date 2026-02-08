import { NextRequest, NextResponse } from "next/server";
import { getYouTubeUploads } from "@/lib/services/youtube";

export const dynamic = "force-dynamic";
export const revalidate = 600; // 10 min

export async function GET(request: NextRequest) {
  const pageToken = request.nextUrl.searchParams.get("pageToken") ?? undefined;
  try {
    const data = await getYouTubeUploads(pageToken);
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/youtube/uploads:", e);
    return NextResponse.json(
      { error: "取得できませんでした", items: [] },
      { status: 200 }
    );
  }
}
