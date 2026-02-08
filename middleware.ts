import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const firstSeg = pathname.split("/").filter(Boolean)[0];
  if (!firstSeg) return NextResponse.next();

  const secret = process.env.ADMIN_PATH_SECRET;
  if (!secret) {
    if (firstSeg.startsWith("admin-"))
      return new NextResponse("Not Found", { status: 404 });
    return NextResponse.next();
  }

  if (firstSeg.startsWith("admin-") && firstSeg !== secret) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
