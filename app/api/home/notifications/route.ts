import { NextResponse } from "next/server";
import { getHomeNotifications } from "@/lib/services/home-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const items = await getHomeNotifications(6);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/home/notifications:", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
