"use client";

import { useRouter } from "next/navigation";
import { FrameSlotEditor } from "@/components/frames/FrameSlotEditor";

export function FrameEditClient({ frame, slots }: { frame: any; slots: any[] }) {
  const router = useRouter();

  async function handleSave(updatedSlots: any[]) {
    await fetch(`/api/frames/${frame.id}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: updatedSlots }),
    });
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Edit Frame: {frame.name}</h2>
      <FrameSlotEditor
        frameUrl={frame.fileUrl}
        frameWidth={frame.dimensionsW}
        frameHeight={frame.dimensionsH}
        initialSlots={slots.map((s: any) => ({
          slotNumber: s.slotNumber,
          x: Number(s.x),
          y: Number(s.y),
          width: Number(s.width),
          height: Number(s.height),
          rotation: Number(s.rotation),
        }))}
        onSave={handleSave}
        onUpload={() => {}}
        mode="edit"
      />
    </div>
  );
}
