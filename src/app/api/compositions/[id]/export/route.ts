import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, allocations, frameSlots, photos, frames } from "@/db/schema";
import { composeFrame } from "@/lib/export";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { UPLOAD_DIR } from "@/lib/upload";

const EXPORT_DIR = join(UPLOAD_DIR, "exports");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  // Return the existing export URL if available
  if (comp.exportUrl) {
    return NextResponse.json({ exportUrl: comp.exportUrl, existing: true });
  }

  return NextResponse.json({ exportUrl: null, existing: false });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  const [frame] = await db.select().from(frames).where(eq(frames.id, comp.frameId!)).limit(1);
  if (!frame) return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });

  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frame.id)).orderBy(frameSlots.slotNumber);
  const allocs = await db.select().from(allocations).where(eq(allocations.compositionId, compId));

  // Fix: Query photos by sessionId, not all photos
  const sessionPhotos = await db.select().from(photos).where(eq(photos.sessionId, comp.sessionId)).orderBy(photos.orderIndex);

  const exportAllocs = allocs.map(alloc => {
    const slot = slots.find(s => s.id === alloc.slotId);
    const photo = sessionPhotos.find(p => p.id === alloc.photoId);
    if (!slot || !photo) return null;

    return {
      photoPath: photo.fileUrl,
      slot: {
        x: Number(slot.x),
        y: Number(slot.y),
        width: Number(slot.width),
        height: Number(slot.height),
        rotation: Number(slot.rotation),
      },
      scale: Number(alloc.scale),
      offsetX: Number(alloc.offsetX),
      offsetY: Number(alloc.offsetY),
      hue: Number(alloc.hue),
      saturation: Number(alloc.saturation),
      brightness: Number(alloc.brightness),
      contrast: Number(alloc.contrast),
    };
  }).filter(Boolean) as any[];

  // Generate preview even if no allocations (empty frame)
  if (exportAllocs.length === 0) {
    const emptyBuffer = await composeFrame(frame.fileUrl, frame.dimensionsW, frame.dimensionsH, []);

    await mkdir(EXPORT_DIR, { recursive: true });
    const filename = `${compId}-${Date.now()}.png`;
    const filepath = join(EXPORT_DIR, filename);
    await writeFile(filepath, emptyBuffer);

    const exportUrl = `/uploads/exports/${filename}`;
    await db.update(compositions).set({ exportUrl }).where(eq(compositions.id, compId));

    return NextResponse.json({ exportUrl });
  }

  const pngBuffer = await composeFrame(frame.fileUrl, frame.dimensionsW, frame.dimensionsH, exportAllocs);

  await mkdir(EXPORT_DIR, { recursive: true });
  const filename = `${compId}-${Date.now()}.png`;
  const filepath = join(EXPORT_DIR, filename);
  await writeFile(filepath, pngBuffer);

  const exportUrl = `/uploads/exports/${filename}`;

  await db.update(compositions).set({ exportUrl }).where(eq(compositions.id, compId));

  return NextResponse.json({ exportUrl });
}
