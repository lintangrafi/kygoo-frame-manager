import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";
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

  const [photo] = await db.insert(photos).values({
    sessionId,
    fileUrl: url,
    originalName: file.name,
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
