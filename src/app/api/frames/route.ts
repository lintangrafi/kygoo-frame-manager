import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { frames } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { saveFile } from "@/lib/upload";

export async function GET() {
  const allFrames = await db.select().from(frames).orderBy(frames.createdAt);
  return NextResponse.json(allFrames);
}

export async function POST(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const additionalFee = parseInt(formData.get("additionalFee") as string) || 0;

  if (!file || !name || !category) {
    return NextResponse.json({ error: "File, name, dan category diperlukan" }, { status: 400 });
  }

  const fileUrl = await saveFile(file, "frames");

  const buffer = Buffer.from(await file.arrayBuffer());
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(buffer).metadata();

  const [frame] = await db.insert(frames).values({
    name,
    category,
    fileUrl,
    dimensionsW: metadata.width || 1200,
    dimensionsH: metadata.height || 1800,
    additionalFee,
  }).returning();

  return NextResponse.json(frame);
}
