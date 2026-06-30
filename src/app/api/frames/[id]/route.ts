import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { frames, frameSlots } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [frame] = await db.select().from(frames)
    .where(and(eq(frames.id, id), isNull(frames.deletedAt)))
    .limit(1);
  if (!frame) return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });

  return NextResponse.json(frame);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update provided fields
  if (body.name !== undefined) updateData.name = body.name;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.occasion !== undefined) updateData.occasion = body.occasion;
  if (body.additionalFee !== undefined) updateData.additionalFee = body.additionalFee;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;

  const [updated] = await db.update(frames).set(updateData)
    .where(and(eq(frames.id, id), isNull(frames.deletedAt)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// Soft delete - marks as deleted instead of actually deleting
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Soft delete
  const [updated] = await db.update(frames).set({
    deletedAt: new Date(),
    isActive: false,
  }).where(and(eq(frames.id, id), isNull(frames.deletedAt)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Frame dihapus" });
}
