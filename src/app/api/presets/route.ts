import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photoPresets } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { eq, asc } from "drizzle-orm";

// GET all presets
export async function GET() {
  const presets = await db.select().from(photoPresets).orderBy(asc(photoPresets.name));
  return NextResponse.json(presets);
}

// POST create preset
export async function POST(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, hue, saturation, brightness, contrast, isDefault } = body;

  if (!name) {
    return NextResponse.json({ error: "Nama preset diperlukan" }, { status: 400 });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await db.update(photoPresets).set({ isDefault: false }).where(eq(photoPresets.isDefault, true));
  }

  const [preset] = await db.insert(photoPresets).values({
    name,
    hue: hue ?? 0,
    saturation: saturation ?? 100,
    brightness: brightness ?? 100,
    contrast: contrast ?? 100,
    isDefault: isDefault ?? false,
  }).returning();

  return NextResponse.json(preset);
}
