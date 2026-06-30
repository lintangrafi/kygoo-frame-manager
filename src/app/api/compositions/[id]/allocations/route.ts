import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { allocations } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;
  const customer = await getCurrentCustomer();

  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    slotId,
    photoId,
    scale,
    offsetX,
    offsetY,
    hue,
    saturation,
    brightness,
    contrast,
    rotation,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
  } = await req.json();

  if (!slotId) return NextResponse.json({ error: "slotId diperlukan" }, { status: 400 });

  // Check if allocation already exists
  const existing = await db.select().from(allocations)
    .where(eq(allocations.compositionId, compId));

  const slotAlloc = existing.find(a => a.slotId === slotId);
  if (slotAlloc) {
    // Update existing allocation
    await db.update(allocations).set({
      photoId: photoId || null,
      scale: String(scale ?? 1),
      offsetX: String(offsetX ?? 0),
      offsetY: String(offsetY ?? 0),
      hue: String(hue ?? 0),
      saturation: String(saturation ?? 100),
      brightness: String(brightness ?? 100),
      contrast: String(contrast ?? 100),
      rotation: String(rotation ?? 0),
      cropX: cropX !== undefined ? String(cropX) : null,
      cropY: cropY !== undefined ? String(cropY) : null,
      cropWidth: cropWidth !== undefined ? String(cropWidth) : null,
      cropHeight: cropHeight !== undefined ? String(cropHeight) : null,
    }).where(eq(allocations.id, slotAlloc.id));
    const [updated] = await db.select().from(allocations).where(eq(allocations.id, slotAlloc.id)).limit(1);
    return NextResponse.json(updated);
  }

  // Create new allocation
  const [alloc] = await db.insert(allocations).values({
    compositionId: compId,
    slotId,
    photoId: photoId || null,
    scale: String(scale ?? 1),
    offsetX: String(offsetX ?? 0),
    offsetY: String(offsetY ?? 0),
    hue: String(hue ?? 0),
    saturation: String(saturation ?? 100),
    brightness: String(brightness ?? 100),
    contrast: String(contrast ?? 100),
    rotation: String(rotation ?? 0),
    cropX: cropX !== undefined ? String(cropX) : null,
    cropY: cropY !== undefined ? String(cropY) : null,
    cropWidth: cropWidth !== undefined ? String(cropWidth) : null,
    cropHeight: cropHeight !== undefined ? String(cropHeight) : null,
  }).returning();

  return NextResponse.json(alloc);
}
