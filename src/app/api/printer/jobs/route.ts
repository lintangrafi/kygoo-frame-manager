import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, frames } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";

// Send composition to printer (Lumabooth Assistant style)
// This creates a "send" job that can be picked up by a connected laptop/tablet

interface PrinterJob {
  id: string;
  compositionId: string;
  frameName: string;
  printSize: string;
  imageUrl: string;
  thumbnailUrl?: string;
  timestamp: number;
  status: "pending" | "sent" | "printed" | "cancelled";
  retryCount: number;
}

// In-memory job store (in production, use Redis or database)
const printerJobs = new Map<string, PrinterJob>();

export async function GET(req: NextRequest) {
  // Get pending jobs for polling
  const pendingJobs = Array.from(printerJobs.values())
    .filter(job => job.status === "pending")
    .sort((a, b) => a.timestamp - b.timestamp);

  return NextResponse.json({
    jobs: pendingJobs,
    serverTime: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  const staffSession = await getStaffSession();
  if (!staffSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { compositionId, printSize, printQuantity = 1 } = await req.json();

  if (!compositionId) {
    return NextResponse.json({ error: "compositionId diperlukan" }, { status: 400 });
  }

  // Get composition with frame info
  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compositionId)).limit(1);
  if (!comp) {
    return NextResponse.json({ error: "Komposisi tidak ditemukan" }, { status: 404 });
  }

  if (!comp.exportUrl) {
    return NextResponse.json({ error: "Export belum tersedia. Silakan generate export terlebih dahulu." }, { status: 400 });
  }

  // Get frame info
  let frameName = "Frame";
  if (comp.frameId) {
    const [frame] = await db.select().from(frames).where(eq(frames.id, comp.frameId)).limit(1);
    if (frame) {
      frameName = frame.name;
    }
  }

  // Create print job
  const jobId = `print-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const job: PrinterJob = {
    id: jobId,
    compositionId,
    frameName,
    printSize: printSize || "auto",
    imageUrl: comp.exportUrl,
    thumbnailUrl: comp.previewUrl || undefined,
    timestamp: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  printerJobs.set(jobId, job);

  // Return job info for client polling
  return NextResponse.json({
    success: true,
    jobId,
    job,
    message: `Job ${jobId} ditambahkan ke print queue`,
    // Info for direct printer connection
    printerInfo: {
      serverIp: req.headers.get("host")?.split(":")[0] || "localhost",
      endpoint: `/api/printer/jobs/${jobId}`,
      webhook: `/api/printer/jobs/${jobId}/complete`,
    },
  });
}

// Update job status (called by printer client)
export async function PUT(req: NextRequest) {
  const { jobId, status, retry } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: "jobId diperlukan" }, { status: 400 });
  }

  const job = printerJobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  }

  if (status) {
    job.status = status;
  }
  if (retry) {
    job.retryCount++;
  }

  printerJobs.set(jobId, job);

  return NextResponse.json({ success: true, job });
}
