import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, printQueue, sessions, staff } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

// GET print queue
export async function GET(req: NextRequest) {
  const staffSession = await getStaffSession();
  if (!staffSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const sessionId = url.searchParams.get("sessionId");

  let query = db.select().from(printQueue);

  // Note: In real implementation, you'd filter by status/sessionId
  const queue = await query;

  return NextResponse.json(queue);
}

// POST add to print queue
export async function POST(req: NextRequest) {
  const staffSession = await getStaffSession();
  if (!staffSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { compositionId, printSize, quantity = 1, priority = 0, notes } = await req.json();

  if (!compositionId || !printSize) {
    return NextResponse.json({ error: "compositionId dan printSize diperlukan" }, { status: 400 });
  }

  // Get composition and session info
  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compositionId)).limit(1);
  if (!comp) {
    return NextResponse.json({ error: "Komposisi tidak ditemukan" }, { status: 404 });
  }

  // Add to print queue
  const [queueItem] = await db.insert(printQueue).values({
    compositionId,
    sessionId: comp.sessionId,
    printSize,
    quantity,
    priority,
    notes,
    staffId: staffSession.id,
    status: "pending",
  }).returning();

  // Trigger notification to connected clients
  if (typeof global !== "undefined" && (global as any).notifyPrintQueue) {
    (global as any).notifyPrintQueue("new", queueItem);
  }

  return NextResponse.json(queueItem);
}
