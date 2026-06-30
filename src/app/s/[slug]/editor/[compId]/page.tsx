import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, frameSlots, allocations, photos, frames } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";
import { getStaffSession } from "@/lib/auth/get-session";
import { PhotoEditor } from "@/components/editor/PhotoEditor";
import { PrinterPanel } from "@/components/printer/PrinterPanel";
import { notFound, redirect } from "next/navigation";

export default async function EditorPage({ params }: { params: Promise<{ slug: string; compId: string }> }) {
  const { slug, compId } = await params;
  const customer = await getCurrentCustomer();
  const staff = await getStaffSession();
  const isStaff = !!staff;

  if (!customer && !staff) redirect(`/s/${slug}`);

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) notFound();

  // Check customer access
  if (customer && customer.slug !== slug) redirect(`/s/${slug}`);

  const [frame] = comp.frameId
    ? await db.select().from(frames).where(eq(frames.id, comp.frameId)).limit(1)
    : [null];
  if (!frame) notFound();

  const slotRows = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frame.id)).orderBy(frameSlots.slotNumber);
  const allocRows = await db.select().from(allocations).where(eq(allocations.compositionId, compId));
  const photoRows = await db.select().from(photos).where(eq(photos.sessionId, comp.sessionId)).orderBy(photos.orderIndex);

  const slots = slotRows.map(s => ({ id: s.id, slotNumber: s.slotNumber, x: Number(s.x), y: Number(s.y), width: Number(s.width), height: Number(s.height) }));
  const allocs = allocRows.map(a => ({
    id: a.id,
    slotId: a.slotId || "",
    photoId: a.photoId || "",
    scale: Number(a.scale),
    offsetX: Number(a.offsetX),
    offsetY: Number(a.offsetY),
    hue: Number(a.hue),
    saturation: Number(a.saturation),
    brightness: Number(a.brightness),
    contrast: Number(a.contrast),
    rotation: Number(a.rotation),
    cropX: a.cropX ? Number(a.cropX) : undefined,
    cropY: a.cropY ? Number(a.cropY) : undefined,
    cropWidth: a.cropWidth ? Number(a.cropWidth) : undefined,
    cropHeight: a.cropHeight ? Number(a.cropHeight) : undefined,
  }));
  const photosList = photoRows.map(p => ({ id: p.id, fileUrl: p.fileUrl, originalName: p.originalName || "" }));

  const compData = {
    id: comp.id,
    exportUrl: comp.exportUrl,
    status: comp.status || "draft",
  };

  return (
    <div className="relative">
      <PhotoEditor
        compositionId={compId}
        comp={compData}
        frameUrl={frame.fileUrl}
        frameWidth={frame.dimensionsW}
        frameHeight={frame.dimensionsH}
        slots={slots}
        allocations={allocs}
        photos={photosList}
        readOnly={comp.status === "finalized"}
      />

      {/* Printer Panel for Staff */}
      {isStaff && (
        <div className="fixed bottom-4 left-4 z-40 w-80">
          <PrinterPanel
            compositionId={compId}
            exportUrl={comp.exportUrl || undefined}
            frameName={frame.name}
          />
        </div>
      )}
    </div>
  );
}
