import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, allocations, frameSlots, photos, frames } from "@/db/schema";
import { composeFrame } from "@/lib/export";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const EXPORT_DIR = process.env.UPLOAD_DIR ? join(process.env.UPLOAD_DIR, "exports") : "./public/uploads/exports";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  const [frame] = await db.select().from(frames).where(eq(frames.id, comp.frameId!)).limit(1);
  if (!frame) return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });

  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frame.id)).orderBy(frameSlots.slotNumber);
  const allocs = await db.select().from(allocations).where(eq(allocations.compositionId, compId));

  const photoIds = allocs.map(a => a.photoId!).filter(Boolean);
  const sessionPhotos = photoIds.length > 0
    ? await db.select().from(photos)
    : [];

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

  const pngBuffer = await composeFrame(frame.fileUrl, frame.dimensionsW, frame.dimensionsH, exportAllocs);

  await mkdir(EXPORT_DIR, { recursive: true });
  const filename = `${compId}-${Date.now()}.png`;
  const filepath = join(EXPORT_DIR, filename);
  await writeFile(filepath, pngBuffer);

  const exportUrl = `/uploads/exports/${filename}`;

  await db.update(compositions).set({ exportUrl }).where(eq(compositions.id, compId));

  return NextResponse.json({ exportUrl });
}
