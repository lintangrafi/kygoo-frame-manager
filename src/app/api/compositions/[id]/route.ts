import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, allocations, frameSlots, frames, photos } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";
import { getStaffSession } from "@/lib/auth/get-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  const [frame] = await db.select().from(frames).where(eq(frames.id, comp.frameId!)).limit(1);
  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, comp.frameId!)).orderBy(frameSlots.slotNumber);
  const allocs = await db.select().from(allocations).where(eq(allocations.compositionId, compId));

  const sessionPhotos = await db.select().from(photos).where(eq(photos.sessionId, comp.sessionId)).orderBy(photos.orderIndex);

  return NextResponse.json({
    composition: comp,
    frame,
    slots,
    allocations: allocs,
    photos: sessionPhotos,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;
  const customer = await getCurrentCustomer();

  const staff = await getStaffSession();
  if (!customer && !staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.status && staff) {
    await db.update(compositions).set({ status: body.status }).where(eq(compositions.id, compId));
  }

  const savedAllocs: any[] = [];

  if (body.allocations && Array.isArray(body.allocations)) {
    for (const alloc of body.allocations) {
      const values = {
        compositionId: compId,
        slotId: alloc.slotId,
        photoId: alloc.photoId,
        scale: String(alloc.scale ?? 1),
        offsetX: String(alloc.offsetX ?? 0),
        offsetY: String(alloc.offsetY ?? 0),
        hue: String(alloc.hue ?? 0),
        saturation: String(alloc.saturation ?? 100),
        brightness: String(alloc.brightness ?? 100),
        contrast: String(alloc.contrast ?? 100),
      };

      // Alloc id "temp-*" = belum ada di DB, INSERT baru
      if (typeof alloc.id === "string" && alloc.id.startsWith("temp-")) {
        const [inserted] = await db.insert(allocations).values(values).returning();
        savedAllocs.push(inserted);
      } else {
        // Alloc dengan id asli dari DB = UPDATE
        await db.update(allocations).set(values).where(eq(allocations.id, alloc.id));
        savedAllocs.push({ id: alloc.id, ...values });
      }
    }
  }

  const [updated] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);

  // Kirim balik savedAllocs agar frontend bisa ganti temp-ids dengan real ids
  return NextResponse.json({ ...updated, _savedAllocations: savedAllocs });
}
