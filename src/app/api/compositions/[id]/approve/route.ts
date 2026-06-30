import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

// Staff approves composition (moves to approved status)
// Status: review -> approved
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: compId } = await params;

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  // Only allow review compositions to be approved
  if (comp.status !== "review") {
    return NextResponse.json({ error: `Tidak bisa approve - status saat ini: ${comp.status}` }, { status: 400 });
  }

  await db.update(compositions).set({ status: "approved" }).where(eq(compositions.id, compId));

  return NextResponse.json({ success: true, status: "approved" });
}
