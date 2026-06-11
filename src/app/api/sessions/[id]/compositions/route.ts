import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, frameSlots, allocations, photos, sessions, frames } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const customer = await getCurrentCustomer();
  if (!customer || customer.sessionId !== sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comps = await db.select().from(compositions).where(eq(compositions.sessionId, sessionId));
  return NextResponse.json(comps);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const customer = await getCurrentCustomer();
  if (!customer || customer.sessionId !== sessionId || customer.status === "completed") {
    return NextResponse.json({ error: "Unauthorized atau sesi sudah selesai" }, { status: 401 });
  }

  const { frameId } = await req.json();
  if (!frameId) return NextResponse.json({ error: "frameId diperlukan" }, { status: 400 });

  const [comp] = await db.insert(compositions).values({ sessionId, frameId }).returning();

  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frameId)).orderBy(frameSlots.slotNumber);
  const sessionPhotos = await db.select().from(photos).where(eq(photos.sessionId, sessionId)).orderBy(photos.orderIndex);

  for (let i = 0; i < slots.length && i < sessionPhotos.length; i++) {
    await db.insert(allocations).values({
      compositionId: comp.id,
      slotId: slots[i].id,
      photoId: sessionPhotos[i].id,
    });
  }

  return NextResponse.json(comp);
}
