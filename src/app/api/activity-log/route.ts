import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { eq, and, desc } from "drizzle-orm";

// GET activity logs
export async function GET(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const limitCount = parseInt(url.searchParams.get("limit") || "50");

  const conditions = [];
  if (entityType) {
    conditions.push(eq(activityLog.entityType, entityType));
  }
  if (entityId) {
    conditions.push(eq(activityLog.entityId, entityId));
  }

  let query = db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limitCount);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const logs = await query;

  return NextResponse.json(logs);
}

// POST create activity log
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { entityType, entityId, action, actorType, actorId, changes, metadata } = body;

  if (!entityType || !action || !actorType) {
    return NextResponse.json({ error: "entityType, action, dan actorType diperlukan" }, { status: 400 });
  }

  // Get IP and user agent
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const [log] = await db.insert(activityLog).values({
    entityType,
    entityId: entityId || null,
    action,
    actorType,
    actorId: actorId || null,
    changes: changes || null,
    metadata: metadata || null,
    ipAddress: ip,
    userAgent,
  }).returning();

  return NextResponse.json(log);
}
