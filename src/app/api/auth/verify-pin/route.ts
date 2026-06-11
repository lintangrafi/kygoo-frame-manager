import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getCustomerSession } from "@/lib/auth/customer-session";

export async function POST(req: NextRequest) {
  const { slug, pin } = await req.json();

  if (!slug || !pin) {
    return NextResponse.json({ error: "Slug dan PIN diperlukan" }, { status: 400 });
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);

  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  if (session.status === "expired" || new Date() > new Date(session.expiresAt)) {
    return NextResponse.json({ error: "Sesi sudah expired" }, { status: 410 });
  }

  if (session.pinCode !== pin) {
    return NextResponse.json({ error: "PIN salah" }, { status: 401 });
  }

  const customerSession = await getCustomerSession();
  customerSession.customer = {
    sessionId: session.id,
    slug: session.slug,
    customerName: session.customerName,
    status: session.status ?? "draft",
    expiresAt: session.expiresAt.toISOString(),
  };
  await customerSession.save();

  return NextResponse.json({
    success: true,
    status: session.status,
    customerName: session.customerName,
  });
}
