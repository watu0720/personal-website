import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { recordVisit, isValidVisitPageKey, hashVisitorId } from "@/lib/repositories/visits";

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function randomVisitorId(): string {
  return crypto.randomUUID?.() ?? `v_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pageKey = typeof body?.page_key === "string" ? body.page_key.trim() : "";
    if (!isValidVisitPageKey(pageKey)) {
      return NextResponse.json({ error: "Invalid page_key" }, { status: 400 });
    }

    let visitorId = request.cookies.get(COOKIE_NAME)?.value?.trim();
    if (!visitorId) {
      visitorId = randomVisitorId();
    }

    const visitorHash = hashVisitorId(visitorId);
    const admin = createServiceRoleClient();
    await recordVisit(admin, pageKey, visitorHash);

    const res = NextResponse.json({ ok: true }, { status: 200 });
    if (!request.cookies.get(COOKIE_NAME)?.value) {
      res.cookies.set(COOKIE_NAME, visitorId, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  } catch (e) {
    console.error("POST /api/visit:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
