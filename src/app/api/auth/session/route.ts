import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth/get-session";

export async function GET() {
  const staff = await getStaffSession();
  if (!staff) {
    return NextResponse.json({ staff: null }, { status: 401 });
  }
  return NextResponse.json({ staff });
}
