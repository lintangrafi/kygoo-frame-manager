import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { photos, allocations } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { saveFile, resolveExistingUploadPath } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const photoId = formData.get("photoId") as string | null;

  if (!file) return NextResponse.json({ error: "File diperlukan" }, { status: 400 });

  const url = await saveFile(file, `sessions/${sessionId}`);

  if (photoId) {
    // Recovery: update existing photo record dengan file baru
    await db.update(photos).set({ fileUrl: url, originalName: file.name }).where(eq(photos.id, photoId));
    return NextResponse.json({ id: photoId, fileUrl: url, originalName: file.name, fileExists: true, recovered: true });
  }

  // Get current max orderIndex
  const existingPhotos = await db.select().from(photos).where(eq(photos.sessionId, sessionId));
  const maxOrder = existingPhotos.reduce((max, p) => Math.max(max, p.orderIndex || 0), 0);

  const [photo] = await db.insert(photos).values({
    sessionId,
    fileUrl: url,
    originalName: file.name,
    orderIndex: maxOrder + 1,
  }).returning();

  return NextResponse.json({ ...photo, fileExists: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const sessionPhotos = await db.select().from(photos).where(eq(photos.sessionId, sessionId)).orderBy(photos.orderIndex);

  const enriched = await Promise.all(
    sessionPhotos.map(async (p) => {
      const existingPath = await resolveExistingUploadPath(p.fileUrl);
      return {
        id: p.id,
        sessionId: p.sessionId,
        fileUrl: existingPath ? p.fileUrl : null,
        originalName: p.originalName,
        orderIndex: p.orderIndex,
        createdAt: p.createdAt,
        fileExists: !!existingPath,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const url = new URL(req.url);
  const photoId = url.searchParams.get("photoId");

  if (!photoId) {
    return NextResponse.json({ error: "photoId diperlukan" }, { status: 400 });
  }

  // Verify photo belongs to this session
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId)).limit(1);

  if (!photo) {
    return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  }

  if (photo.sessionId !== sessionId) {
    return NextResponse.json({ error: "Foto tidak milik sesi ini" }, { status: 400 });
  }

  // Remove photo from any allocations that reference it
  await db.update(allocations).set({ photoId: null }).where(eq(allocations.photoId, photoId));

  // Delete the photo
  await db.delete(photos).where(eq(photos.id, photoId));

  return NextResponse.json({ success: true });
}
