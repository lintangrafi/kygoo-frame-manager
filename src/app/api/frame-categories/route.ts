import { NextRequest, NextResponse } from "next/server";
import { eq, asc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { frameCategories } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

export const runtime = "nodejs";

export async function GET() {
  const categories = await db
    .select()
    .from(frameCategories)
    .orderBy(asc(frameCategories.sortOrder), asc(frameCategories.name));
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, slug, icon, description, parentId, sortOrder } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug diperlukan" }, { status: 400 });
  }

  const [category] = await db
    .insert(frameCategories)
    .values({ name, slug, icon: icon || "frame", description, parentId: parentId || null, sortOrder: sortOrder || 0 })
    .returning();

  return NextResponse.json(category);
}