"use client";

import { useRouter } from "next/navigation";
import { FrameSlotEditor } from "@/components/frames/FrameSlotEditor";

export default function NewFramePage() {
  const router = useRouter();

  async function handleUpload(file: File, name: string, category: string, additionalFee: number) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("category", category);
    formData.append("additionalFee", String(additionalFee));

    const res = await fetch("/api/frames", { method: "POST", body: formData });
    const frame = await res.json();

    if (frame.id) {
      router.push(`/staff/frames/${frame.id}`);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upload Frame Baru</h2>
      <FrameSlotEditor
        frameUrl=""
        frameWidth={1200}
        frameHeight={1800}
        initialSlots={[]}
        onSave={() => {}}
        onUpload={handleUpload}
        mode="create"
      />
    </div>
  );
}
