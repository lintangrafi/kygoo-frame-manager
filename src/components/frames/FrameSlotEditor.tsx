"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Plus, Trash2, Save } from "lucide-react";

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
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  const SCALE = Math.min(1, 600 / Math.max(frameWidth, frameHeight));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = frameWidth * SCALE;
    canvas.height = frameHeight * SCALE;

    // Background
    ctx.fillStyle = "#FEFAF3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid pattern untuk create mode
    if (mode === "create" && !uploadedPreview) {
      ctx.strokeStyle = "rgba(212, 135, 43, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Frame outline guide
      ctx.strokeStyle = "rgba(212, 135, 43, 0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      ctx.setLineDash([]);

      // Placeholder text
      ctx.fillStyle = "rgba(92, 45, 26, 0.15)";
      ctx.font = `${14 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Upload file PNG frame di panel kanan", canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Dimensi: ${frameWidth} × ${frameHeight}px`, canvas.width / 2, canvas.height / 2 + 24);
      ctx.textAlign = "start";
    }

    // Jika ada frameUrl atau preview, gambar frame
    const imgSrc = uploadedPreview || frameUrl;
    if (imgSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Gambar slot
        slots.forEach((slot, i) => {
          const x = Number(slot.x) * SCALE;
          const y = Number(slot.y) * SCALE;
          const w = Number(slot.width) * SCALE;
          const h = Number(slot.height) * SCALE;
          const isSelected = selectedSlot === i;

          // Fill
          ctx.fillStyle = isSelected ? "rgba(212, 135, 43, 0.15)" : "rgba(212, 135, 43, 0.06)";
          ctx.fillRect(x, y, w, h);

          // Border
          ctx.strokeStyle = isSelected ? "#D4872B" : "rgba(212, 135, 43, 0.4)";
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.setLineDash(isSelected ? [] : [5, 3]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);

          // Label
          ctx.fillStyle = isSelected ? "#2D1810" : "rgba(92, 45, 26, 0.5)";
          ctx.font = `600 ${11 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillText(`Slot ${slot.slotNumber}`, x + 6, y + 16);
        });
      };
      img.src = imgSrc;
    } else {
      // Gambar slot di atas grid (mode create tanpa frame)
      slots.forEach((slot, i) => {
        const x = Number(slot.x) * SCALE;
        const y = Number(slot.y) * SCALE;
        const w = Number(slot.width) * SCALE;
        const h = Number(slot.height) * SCALE;
        const isSelected = selectedSlot === i;

        ctx.fillStyle = isSelected ? "rgba(212, 135, 43, 0.15)" : "rgba(212, 135, 43, 0.06)";
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = isSelected ? "#D4872B" : "rgba(212, 135, 43, 0.4)";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.setLineDash(isSelected ? [] : [5, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        ctx.fillStyle = isSelected ? "#2D1810" : "rgba(92, 45, 26, 0.5)";
        ctx.font = `600 ${11 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(`Slot ${slot.slotNumber}`, x + 6, y + 16);
      });
    }
  }, [frameUrl, uploadedPreview, frameWidth, frameHeight, slots, selectedSlot, SCALE, mode]);

  useEffect(() => { draw(); }, [draw]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onload = () => setUploadedPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  }

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
    const margin = Number(frameWidth) * 0.1;
    const newSlot: Slot = {
      slotNumber: slots.length + 1,
      x: margin + (slots.length % 3) * 50,
      y: margin + Math.floor(slots.length / 3) * 50,
      width: Number(frameWidth) - margin * 2,
      height: Number(frameHeight) * 0.25,
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
            className="flex items-center gap-1.5 bg-espresso text-cream px-4 py-2 rounded-xl text-xs font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Slot
          </button>
          <button
            onClick={deleteSlot}
            disabled={selectedSlot === null}
            className="flex items-center gap-1.5 bg-red-50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 disabled:opacity-30 transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Slot
          </button>
          <button
            onClick={() => onSave(slots)}
            className="flex items-center gap-1.5 bg-amber text-espresso px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Layout
          </button>
        </div>
        <p className="mt-2 text-[11px] text-mahogany/30 text-center">
          Klik canvas untuk memilih slot &bull; Dimensi frame: {frameWidth} × {frameHeight}px
        </p>
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
              <div className="bg-cream border-2 border-dashed border-amber/10 rounded-xl px-4 py-6 text-center hover:border-amber/20 transition-all duration-200">
                <Upload className="w-6 h-6 text-mahogany/15 mx-auto mb-2" />
                <p className="text-[11px] text-mahogany/30 font-medium mb-2">
                  PNG dengan area transparan untuk tempat foto
                </p>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFileSelect}
                  className="block w-full text-xs text-mahogany/20 file:mx-auto file:py-2 file:px-4 file:rounded-xl file:text-xs file:font-bold file:bg-espresso file:text-cream file:border-0 hover:file:bg-mahogany file:transition-colors file:cursor-pointer"
                />
              </div>
              {file && (
                <p className="mt-2 text-[11px] text-amber font-semibold">
                  ✓ {file.name}
                </p>
              )}
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
