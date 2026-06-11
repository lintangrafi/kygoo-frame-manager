import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });

  return NextResponse.json(session);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const [updated] = await db.update(sessions).set({
    status: body.status,
    customerName: body.customerName,
    basePrice: body.basePrice,
  }).where(eq(sessions.id, id)).returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(sessions).where(eq(sessions.id, id));
  return NextResponse.json({ success: true });
}
