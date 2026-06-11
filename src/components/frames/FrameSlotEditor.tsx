"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Slot {
  slotNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface FrameSlotEditorProps {
  frameUrl: string;
  frameWidth: number;
  frameHeight: number;
  initialSlots: Slot[];
  onSave: (slots: Slot[]) => void;
  onUpload: (file: File, name: string, category: string, additionalFee: number) => void;
  mode: "create" | "edit";
}

export function FrameSlotEditor({ frameUrl, frameWidth, frameHeight, initialSlots, onSave, onUpload, mode }: FrameSlotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("2R");
  const [additionalFee, setAdditionalFee] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const SCALE = Math.min(1, 600 / Math.max(frameWidth, frameHeight));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = frameWidth * SCALE;
    canvas.height = frameHeight * SCALE;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      slots.forEach((slot, i) => {
        const x = Number(slot.x) * SCALE;
        const y = Number(slot.y) * SCALE;
        const w = Number(slot.width) * SCALE;
        const h = Number(slot.height) * SCALE;
        const isSelected = selectedSlot === i;

        ctx.strokeStyle = isSelected ? "#D4872B" : "#5C2D1A";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.setLineDash(isSelected ? [] : [5, 3]);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = isSelected ? "rgba(212, 135, 43, 0.15)" : "rgba(92, 45, 26, 0.06)";
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = "#2D1810";
        ctx.font = `600 ${11 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(`Slot ${slot.slotNumber}`, x + 6, y + 18);
      });
    };
    img.src = frameUrl;
  }, [frameUrl, frameWidth, frameHeight, slots, selectedSlot, SCALE]);

  useEffect(() => { draw(); }, [draw]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / SCALE;
    const my = (e.clientY - rect.top) / SCALE;

    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i];
      if (mx >= Number(s.x) && mx <= Number(s.x) + Number(s.width) &&
          my >= Number(s.y) && my <= Number(s.y) + Number(s.height)) {
        setSelectedSlot(i);
        return;
      }
    }
    setSelectedSlot(null);
  }

  function addSlot() {
    const newSlot: Slot = {
      slotNumber: slots.length + 1,
      x: 10,
      y: 10 + slots.length * 60,
      width: Number(frameWidth) * 0.4,
      height: Number(frameHeight) * 0.3,
      rotation: 0,
    };
    setSlots([...slots, newSlot]);
    setSelectedSlot(slots.length);
  }

  function deleteSlot() {
    if (selectedSlot === null) return;
    const updated = slots.filter((_, i) => i !== selectedSlot).map((s, i) => ({ ...s, slotNumber: i + 1 }));
    setSlots(updated);
    setSelectedSlot(null);
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="border-2 border-amber/10 rounded-2xl cursor-crosshair bg-cream-card max-w-full shadow-lg shadow-amber/5"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={addSlot}
            className="bg-espresso text-cream px-4 py-2 rounded-xl text-xs font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5"
          >
            + Tambah Slot
          </button>
          <button
            onClick={deleteSlot}
            disabled={selectedSlot === null}
            className="bg-red-50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 disabled:opacity-30 transition-all duration-200"
          >
            Hapus Slot
          </button>
          <button
            onClick={() => onSave(slots)}
            className="bg-amber text-espresso px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10"
          >
            Simpan Layout
          </button>
        </div>
      </div>
      <div className="w-56 space-y-4">
        {mode === "create" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                Nama Frame
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Classic 2R"
                className="w-full bg-cream border-2 border-amber/10 rounded-xl px-3 py-2.5 text-sm text-espresso placeholder:text-mahogany/15 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/5 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                Kategori
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-cream border-2 border-amber/10 rounded-xl px-3 py-2.5 text-sm text-espresso focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/5 transition-all"
              >
                <option value="2R">2R</option>
                <option value="4R">4R</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                Biaya Tambahan (Rp)
              </label>
              <input
                type="number"
                value={additionalFee}
                onChange={e => setAdditionalFee(Number(e.target.value))}
                className="w-full bg-cream border-2 border-amber/10 rounded-xl px-3 py-2.5 text-sm text-espresso focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/5 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                File Frame (PNG)
              </label>
              <input
                type="file"
                accept="image/png"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-mahogany/40 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:text-xs file:font-bold file:bg-espresso file:text-cream file:border-0 hover:file:bg-mahogany file:transition-colors file:cursor-pointer"
              />
            </div>
            <button
              onClick={() => file && onUpload(file, name, category, additionalFee)}
              disabled={!file || !name}
              className="w-full bg-amber text-espresso rounded-xl py-3 text-sm font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Upload Frame
            </button>
          </>
        )}
      </div>
    </div>
  );
}
