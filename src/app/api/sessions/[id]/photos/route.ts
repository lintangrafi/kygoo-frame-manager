import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "File diperlukan" }, { status: 400 });

  const url = await saveFile(file, `sessions/${sessionId}`);
  const [photo] = await db.insert(photos).values({
    sessionId,
    fileUrl: url,
    originalName: file.name,
  }).returning();

  return NextResponse.json(photo);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const sessionPhotos = await db.select().from(photos).where(eq(photos.sessionId, sessionId)).orderBy(photos.orderIndex);
  return NextResponse.json(sessionPhotos);
}
