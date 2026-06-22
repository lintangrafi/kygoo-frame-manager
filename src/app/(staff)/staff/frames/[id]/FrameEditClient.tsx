"use client";

import { useRouter } from "next/navigation";
import { FrameSlotEditor } from "@/components/frames/FrameSlotEditor";
import { CategoryTree } from "@/components/frames/CategoryTree";

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

  async function handleUpdateDetail(name: string, category: string, additionalFee: number, categoryId?: string) {
    await fetch(`/api/frames/${frame.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, additionalFee, categoryId }),
    });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main editor */}
      <div className="lg:col-span-3">
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
          initialName={frame.name}
          initialCategory={frame.category}
          initialAdditionalFee={frame.additionalFee}
          onUpdateDetail={handleUpdateDetail}
        />
      </div>

      {/* Sidebar — Category Tree */}
      <div className="space-y-4">
        <CategoryTree
          selectedId={frame.categoryId}
          onSelect={(cat) => {
            handleUpdateDetail(frame.name, frame.category, frame.additionalFee, cat.id);
          }}
        />
        <div className="bg-cream-card rounded-2xl p-4 border border-amber/5">
          <div className="text-xs font-bold text-mahogany/50 uppercase tracking-wider mb-3">
            Metadata Frame
          </div>
          <pre className="text-[10px] text-mahogany/40 whitespace-pre-wrap">
            {JSON.stringify(frame.metadata || {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
