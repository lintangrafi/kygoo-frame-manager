import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, frameSlots, allocations, photos, frames } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";
import { PhotoEditor } from "@/components/editor/PhotoEditor";
import { notFound, redirect } from "next/navigation";

export default async function EditorPage({ params }: { params: Promise<{ slug: string; compId: string }> }) {
  const { slug, compId } = await params;
  const customer = await getCurrentCustomer();
  if (!customer || customer.slug !== slug) redirect(`/s/${slug}`);

  const [comp] = await db.select().from(compositions).where(eq(compositions.id, compId)).limit(1);
  if (!comp) notFound();

  const [frame] = await db.select().from(frames).where(eq(frames.id, comp.frameId!)).limit(1);
  if (!frame) notFound();

  const slotRows = await db.select().from(frameSlots).where(eq(frameSlots.frameId, frame.id)).orderBy(frameSlots.slotNumber);
  const allocRows = await db.select().from(allocations).where(eq(allocations.compositionId, compId));
  const photoRows = await db.select().from(photos).where(eq(photos.sessionId, comp.sessionId)).orderBy(photos.orderIndex);

  const slots = slotRows.map(s => ({ id: s.id, slotNumber: s.slotNumber, x: Number(s.x), y: Number(s.y), width: Number(s.width), height: Number(s.height) }));
  const allocs = allocRows.map(a => ({ id: a.id, slotId: a.slotId!, photoId: a.photoId!, scale: Number(a.scale), offsetX: Number(a.offsetX), offsetY: Number(a.offsetY), hue: Number(a.hue), saturation: Number(a.saturation), brightness: Number(a.brightness), contrast: Number(a.contrast) }));
  const photosList = photoRows.map(p => ({ id: p.id, fileUrl: p.fileUrl, originalName: p.originalName || "" }));

  return (
    <PhotoEditor
      compositionId={compId}
      frameUrl={frame.fileUrl}
      frameWidth={frame.dimensionsW}
      frameHeight={frame.dimensionsH}
      slots={slots}
      allocations={allocs}
      photos={photosList}
      readOnly={comp.status === "finalized"}
    />
  );
}
