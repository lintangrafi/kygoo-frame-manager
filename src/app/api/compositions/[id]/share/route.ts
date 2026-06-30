import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, sessions } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";
import { getStaffSession } from "@/lib/auth/get-session";
import { v4 as uuid } from "uuid";

// Generate share token and URL
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;

  const customer = await getCurrentCustomer();
  const staff = await getStaffSession();

  if (!customer && !staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) {
    return NextResponse.json({ error: "Komposisi tidak ditemukan" }, { status: 404 });
  }

  // Check permission
  if (customer && comp.sessionId !== customer.sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate share token if not exists
  let shareToken = comp.shareToken;
  if (!shareToken) {
    shareToken = uuid().split("-")[0]; // Short token
    await db.update(compositions).set({ shareToken }).where(eq(compositions.id, compId));
  }

  // Generate share URL
  const baseUrl = req.nextUrl.origin;
  const shareUrl = `${baseUrl}/share/${shareToken}`;

  await db.update(compositions).set({ shareUrl }).where(eq(compositions.id, compId));

  return NextResponse.json({ shareToken, shareUrl });
}
