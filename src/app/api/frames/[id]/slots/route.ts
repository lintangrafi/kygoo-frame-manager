import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { frameSlots } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: frameId } = await params;
  const { slots } = await req.json();

  await db.delete(frameSlots).where(eq(frameSlots.frameId, frameId));

  if (slots && slots.length > 0) {
    await db.insert(frameSlots).values(
      slots.map((s: { slotNumber: number; x: number; y: number; width: number; height: number; rotation?: number }) => ({
        frameId,
        slotNumber: s.slotNumber,
        x: String(s.x),
        y: String(s.y),
        width: String(s.width),
        height: String(s.height),
        rotation: String(s.rotation || 0),
      }))
    );
  }

  const updated = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frameId));
  return NextResponse.json(updated);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: frameId } = await params;
  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frameId)).orderBy(frameSlots.slotNumber);
  return NextResponse.json(slots);
}
