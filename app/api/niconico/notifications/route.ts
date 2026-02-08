import { NextResponse } from "next/server";
import { getNiconicoNotifications } from "@/lib/services/niconico";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const data = await getNiconicoNotifications();
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/niconico/notifications:", e);
    return NextResponse.json(
      { error: "取得できませんでした", posts: [], mylistUpdates: [] },
      { status: 200 }
    );
  }
}
