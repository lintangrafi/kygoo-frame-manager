import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { frames, frameSlots } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { copyFileSync } from "fs";
import { join, dirname } from "path";
import { getUploadPath } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sourceId } = await params;
  const body = await req.json().catch(() => ({}));

  // Get source frame
  const [sourceFrame] = await db.select().from(frames)
    .where(and(eq(frames.id, sourceId), isNull(frames.deletedAt)))
    .limit(1);

  if (!sourceFrame) {
    return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });
  }

  // Copy the frame file
  const sourcePath = getUploadPath(sourceFrame.fileUrl);
  const ext = sourceFrame.fileUrl.split(".").pop() || "png";
  const newFilename = `${sourceFrame.id}-copy-${Date.now()}.${ext}`;
  const newFileUrl = `/uploads/frames/${newFilename}`;
  const newPath = getUploadPath(newFileUrl);

  try {
    // Ensure directory exists
    const { mkdir } = await import("fs/promises");
    await mkdir(dirname(newPath), { recursive: true });

    // Copy file
    const { copyFile } = await import("fs/promises");
    await copyFile(sourcePath, newPath);

    // Copy thumbnail if exists
    let newThumbnailUrl = null;
    if (sourceFrame.thumbnailUrl) {
      const thumbExt = sourceFrame.thumbnailUrl.split(".").pop() || "png";
      const newThumbFilename = `${sourceFrame.id}-thumb-copy-${Date.now()}.${thumbExt}`;
      newThumbnailUrl = `/uploads/frames/thumbnails/${newThumbFilename}`;
      const newThumbPath = getUploadPath(newThumbnailUrl);
      await mkdir(dirname(newThumbPath), { recursive: true });
      await copyFile(getUploadPath(sourceFrame.thumbnailUrl), newThumbPath);
    }

    // Create new frame
    const newName = body.name || `${sourceFrame.name} (Copy)`;

    const [newFrame] = await db.insert(frames).values({
      name: newName,
      category: body.category || sourceFrame.category,
      occasion: body.occasion || sourceFrame.occasion,
      fileUrl: newFileUrl,
      thumbnailUrl: newThumbnailUrl || sourceFrame.thumbnailUrl,
      dimensionsW: sourceFrame.dimensionsW,
      dimensionsH: sourceFrame.dimensionsH,
      additionalFee: body.additionalFee !== undefined ? body.additionalFee : sourceFrame.additionalFee,
      tags: body.tags || sourceFrame.tags,
      description: body.description || sourceFrame.description,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isFeatured: false,
      parentId: sourceFrame.id,
      version: 1,
    }).returning();

    // Copy slots
    const sourceSlots = await db.select().from(frameSlots)
      .where(eq(frameSlots.frameId, sourceId));

    if (sourceSlots.length > 0) {
      await db.insert(frameSlots).values(
        sourceSlots.map(slot => ({
          frameId: newFrame.id,
          slotNumber: slot.slotNumber,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          rotation: slot.rotation,
        }))
      );
    }

    return NextResponse.json({
      frame: newFrame,
      slotsCount: sourceSlots.length,
      message: "Frame berhasil diduplikasi",
    });
  } catch (error) {
    console.error("Failed to duplicate frame:", error);
    return NextResponse.json({ error: "Gagal menduplikasi frame" }, { status: 500 });
  }
}
