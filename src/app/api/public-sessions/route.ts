import { NextResponse } from "next/server";
import { eq, and, gte, or } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeSessions = await db
    .select({
      id: sessions.id,
      slug: sessions.slug,
      customerName: sessions.customerName,
      status: sessions.status,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(
      or(
        // Sesi yang dibuat hari ini (draft/active/completed)
        gte(sessions.createdAt, today),
        // Sesi yang masih active meskipun dibuat sebelumnya
        eq(sessions.status, "active")
      )
    )
    .orderBy(sessions.createdAt);

  return NextResponse.json(activeSessions);
}
