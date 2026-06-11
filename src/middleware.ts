import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import { StaffSession } from "@/lib/auth/types";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<{ staff?: StaffSession }>(req, res, sessionOptions);

  if (req.nextUrl.pathname.startsWith("/staff") && !req.nextUrl.pathname.startsWith("/staff/login")) {
    if (!session.staff) {
      return NextResponse.redirect(new URL("/staff/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/staff/:path*"],
};
