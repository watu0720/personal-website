import { NextResponse } from "next/server";
import { getYouTubeNotifications } from "@/lib/services/youtube";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const data = await getYouTubeNotifications();
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/youtube/notifications:", e);
    return NextResponse.json(
      { error: "取得できませんでした", posts: [], playlistUpdates: [] },
      { status: 200 }
    );
  }
}
