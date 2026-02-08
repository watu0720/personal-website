import { NextResponse } from "next/server";
import { getNiconicoMylists } from "@/lib/services/niconico";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function GET() {
  try {
    const data = await getNiconicoMylists();
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/niconico/mylists:", e);
    return NextResponse.json({ error: "取得できませんでした", items: [] }, { status: 200 });
  }
}
