import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");

  // Use provided date or default to today
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  // End of the target date
  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

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
      and(
        // Session dibuat pada tanggal yang dipilih
        gte(sessions.createdAt, targetDate),
        sql`${sessions.createdAt} <= ${endDate}`
      )
    )
    .orderBy(sessions.createdAt);

  return NextResponse.json(activeSessions);
}
