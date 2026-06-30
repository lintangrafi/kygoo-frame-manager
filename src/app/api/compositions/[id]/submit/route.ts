import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";

// Customer submits composition for review
// Status: draft -> review
// Also generates a preview
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: compId } = await params;
  const customer = await getCurrentCustomer();

  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) return NextResponse.json({ error: "Composition tidak ditemukan" }, { status: 404 });

  if (comp.sessionId !== customer.sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow draft compositions to be submitted for review
  if (comp.status !== "draft") {
    return NextResponse.json({ error: `Tidak bisa submit - status saat ini: ${comp.status}` }, { status: 400 });
  }

  // Generate preview URL
  const baseUrl = req.nextUrl.origin;
  const exportRes = await fetch(`${baseUrl}/api/compositions/${compId}/export`, {
    method: "POST",
  });

  let previewUrl = comp.previewUrl;
  if (exportRes.ok) {
    const { exportUrl } = await exportRes.json();
    previewUrl = exportUrl;
  }

  await db.update(compositions).set({
    status: "review",
    previewUrl,
  }).where(eq(compositions.id, compId));

  return NextResponse.json({ success: true, status: "review", previewUrl });
}
