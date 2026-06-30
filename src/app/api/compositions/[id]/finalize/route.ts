import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, sessions, frames } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

// Staff finalizes composition (generates export and locks it)
// Status: approved -> finalized
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: compId } = await params;

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  // Only allow approved compositions to be finalized
  if (comp.status !== "approved") {
    return NextResponse.json({ error: `Tidak bisa finalisasi - status saat ini: ${comp.status}` }, { status: 400 });
  }

  // Generate export
  const exportRes = await fetch(`${req.nextUrl.origin}/api/compositions/${compId}/export`, {
    method: "POST",
  });

  if (!exportRes.ok) {
    return NextResponse.json({ error: "Gagal generate export" }, { status: 500 });
  }

  const { exportUrl } = await exportRes.json();

  // Update status to finalized and save export URL
  await db.update(compositions).set({
    status: "finalized",
    exportUrl,
  }).where(eq(compositions.id, compId));

  // Calculate total extra frame fee for the session
  const comps = await db.select({
    frameId: compositions.frameId,
  }).from(compositions).where(eq(compositions.sessionId, comp.sessionId));

  let totalFee = 0;
  for (const c of comps) {
    if (c.frameId) {
      const [frame] = await db.select({ fee: frames.additionalFee }).from(frames).where(eq(frames.id, c.frameId)).limit(1);
      if (frame?.fee) totalFee += frame.fee;
    }
  }

  await db.update(sessions).set({ extraFrameFee: totalFee }).where(eq(sessions.id, comp.sessionId));

  return NextResponse.json({ success: true, status: "finalized", exportUrl });
}
