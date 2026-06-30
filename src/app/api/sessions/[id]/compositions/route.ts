import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, frameSlots, allocations, photos } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";
import { getStaffSession } from "@/lib/auth/get-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  // Izinkan customer yang login atau staff
  const customer = await getCurrentCustomer();
  const staff = await getStaffSession();

  if (!customer && !staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (customer && customer.sessionId !== sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comps = await db.select().from(compositions).where(eq(compositions.sessionId, sessionId));
  return NextResponse.json(comps);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  const customer = await getCurrentCustomer();
  const staff = await getStaffSession();

  // Customer: harus login sebagai customer session yang sesuai
  if (customer) {
    if (customer.sessionId !== sessionId || customer.status === "completed") {
      return NextResponse.json({ error: "Sesi sudah selesai atau tidak sesuai" }, { status: 401 });
    }
  } else if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { frameId, autoFill = true } = await req.json();
  if (!frameId) return NextResponse.json({ error: "frameId diperlukan" }, { status: 400 });

  // Check existing compositions for this session
  const existingComps = await db.select().from(compositions)
    .where(eq(compositions.sessionId, sessionId));

  // Limit: max 3 compositions per session for customers
  if (customer && existingComps.length >= 3) {
    return NextResponse.json({
      error: "Maksimal 3 frame per sesi. Hapus frame yang tidak diperlukan terlebih dahulu.",
      existingComps
    }, { status: 400 });
  }

  // Check if this frame already has a composition for this session
  const existingWithFrame = existingComps.find(c => c.frameId === frameId);
  if (existingWithFrame) {
    return NextResponse.json({
      error: "Frame ini sudah dipilih untuk sesi ini",
      existingComp: existingWithFrame
    }, { status: 400 });
  }

  const [comp] = await db.insert(compositions).values({ sessionId, frameId, status: "draft" }).returning();

  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frameId)).orderBy(frameSlots.slotNumber);
  const sessionPhotos = await db.select().from(photos).where(eq(photos.sessionId, sessionId)).orderBy(photos.orderIndex);

  // Smart auto-fill logic:
  // - If autoFill is true, distribute photos evenly across slots
  // - First slot gets first photo, second slot gets second photo, etc.
  // - If more slots than photos, remaining slots get null
  // - If more photos than slots, extra photos are ignored

  for (let i = 0; i < slots.length; i++) {
    const photoId = autoFill && sessionPhotos[i] ? sessionPhotos[i].id : null;
    await db.insert(allocations).values({
      compositionId: comp.id,
      slotId: slots[i].id,
      photoId,
      scale: "1",
      offsetX: "0",
      offsetY: "0",
      hue: "0",
      saturation: "100",
      brightness: "100",
      contrast: "100",
      rotation: "0",
    });
  }

  return NextResponse.json({
    ...comp,
    autoFilled: autoFill,
    slotsFilled: autoFill ? Math.min(slots.length, sessionPhotos.length) : 0,
    totalPhotos: sessionPhotos.length,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const url = new URL(req.url);
  const compId = url.searchParams.get("compId");

  if (!compId) {
    return NextResponse.json({ error: "compId diperlukan" }, { status: 400 });
  }

  const customer = await getCurrentCustomer();
  const staff = await getStaffSession();

  if (!customer && !staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify composition belongs to this session
  const [comp] = await db.select().from(compositions)
    .where(eq(compositions.id, compId))
    .limit(1);

  if (!comp) {
    return NextResponse.json({ error: "Komposisi tidak ditemukan" }, { status: 404 });
  }

  if (comp.sessionId !== sessionId) {
    return NextResponse.json({ error: "Komposisi tidak milik sesi ini" }, { status: 400 });
  }

  // Customers can only delete draft compositions
  if (customer && comp.status !== "draft") {
    return NextResponse.json({ error: "Hanya bisa menghapus komposisi yang masih draft" }, { status: 400 });
  }

  // Delete allocations first
  await db.delete(allocations).where(eq(allocations.compositionId, compId));

  // Delete composition
  await db.delete(compositions).where(eq(compositions.id, compId));

  return NextResponse.json({ success: true });
}
