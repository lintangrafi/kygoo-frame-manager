import { eq } from "drizzle-orm";
import { db } from "@/db";
import { frames, frameSlots } from "@/db/schema";
import { FrameEditClient } from "./FrameEditClient";
import { notFound } from "next/navigation";

export default async function EditFramePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [frame] = await db.select().from(frames).where(eq(frames.id, id)).limit(1);
  if (!frame) notFound();

  const slots = await db.select().from(frameSlots).where(eq(frameSlots.frameId, id)).orderBy(frameSlots.slotNumber);

  return <FrameEditClient frame={frame} slots={slots} />;
}
