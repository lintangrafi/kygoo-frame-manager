import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { sessions, photos as photosTable } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { saveFile } from "@/lib/upload";

function generateSlug(name: string): string {
  const code = name.substring(0, 3).toUpperCase().replace(/\s/g, "");
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${code}-${year}-${random}`;
}

export async function GET(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allSessions = await db.select().from(sessions).orderBy(desc(sessions.createdAt));
  return NextResponse.json(allSessions);
}

export async function POST(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const customerName = formData.get("customerName") as string;
  const basePrice = parseInt(formData.get("basePrice") as string) || 0;
  const files = formData.getAll("photos") as File[];

  if (!customerName) {
    return NextResponse.json({ error: "Nama pelanggan diperlukan" }, { status: 400 });
  }

  const slug = generateSlug(customerName);
  const pin = Math.floor(1000 + Math.random() * 9000).toString();

  const [session] = await db.insert(sessions).values({
    slug,
    pinCode: pin,
    customerName,
    basePrice,
    staffId: staff.id,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  }).returning();

  for (let i = 0; i < files.length; i++) {
    const url = await saveFile(files[i], `sessions/${session.id}`);
    await db.insert(photosTable).values({
      sessionId: session.id,
      fileUrl: url,
      originalName: files[i].name,
      orderIndex: i,
    });
  }

  return NextResponse.json(session);
}
