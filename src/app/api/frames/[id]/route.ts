import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { frames } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [frame] = await db.select().from(frames).where(eq(frames.id, id)).limit(1);
  if (!frame) return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });

  return NextResponse.json(frame);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const [updated] = await db.update(frames).set({
    name: body.name,
    category: body.category,
    additionalFee: body.additionalFee,
    isActive: body.isActive,
  }).where(eq(frames.id, id)).returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(frames).where(eq(frames.id, id));
  return NextResponse.json({ success: true });
}
