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
  initialName?: string;
  initialCategory?: string;
  initialAdditionalFee?: number;
  onUpdateDetail?: (name: string, category: string, additionalFee: number) => void;
}

const HANDLE_SIZE = 10;
const MIN_SLOT_SIZE = 30;

export function FrameSlotEditor({
  frameUrl, frameWidth, frameHeight, initialSlots, onSave, onUpload, mode,
  initialName = "", initialCategory = "2R", initialAdditionalFee = 0,
  onUpdateDetail,
}: FrameSlotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [additionalFee, setAdditionalFee] = useState(initialAdditionalFee);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [detailSaved, setDetailSaved] = useState(false);

  // Drag / resize state
  const [dragMode, setDragMode] = useState<"move" | "resize" | null>(null);
  const [resizeCorner, setResizeCorner] = useState<"nw" | "ne" | "sw" | "se" | null>(null);
  const dragStartRef = useRef<{ mx: number; my: number; slot: { x: number; y: number; width: number; height: number } } | null>(null);

  const SCALE = Math.min(1, 600 / Math.max(frameWidth, frameHeight));
  const scaleRef = useRef(SCALE);
  scaleRef.current = SCALE;

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
    if (mode === "create" && !uploadedPreview && !frameUrl) {
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

      ctx.strokeStyle = "rgba(212, 135, 43, 0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(92, 45, 26, 0.15)";
      ctx.font = `${14 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Upload file PNG frame di panel kanan", canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Dimensi: ${frameWidth} × ${frameHeight}px`, canvas.width / 2, canvas.height / 2 + 24);
      ctx.textAlign = "start";
    }

    const imgSrc = uploadedPreview || (frameUrl || undefined);
    if (imgSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        drawSlots(ctx);
      };
      img.src = imgSrc;
    } else {
      drawSlots(ctx);
    }
  }, [frameUrl, uploadedPreview, frameWidth, frameHeight, slots, selectedSlot, SCALE, mode]);

  function drawSlots(ctx: CanvasRenderingContext2D) {
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

      // Resize handles (only on selected slot)
      if (isSelected) {
        ctx.fillStyle = "#D4872B";
        const hs = HANDLE_SIZE;
        // nw
        ctx.fillRect(x - hs / 2, y - hs / 2, hs, hs);
        // ne
        ctx.fillRect(x + w - hs / 2, y - hs / 2, hs, hs);
        // sw
        ctx.fillRect(x - hs / 2, y + h - hs / 2, hs, hs);
        // se
        ctx.fillRect(x + w - hs / 2, y + h - hs / 2, hs, hs);
      }
    });
  }

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

  // Detect resize corner at unscaled mouse coordinates
  function getResizeCorner(mxUnscaled: number, myUnscaled: number, slot: Slot): "nw" | "ne" | "sw" | "se" | null {
    const hs = HANDLE_SIZE / SCALE;
    const corners: { corner: "nw" | "ne" | "sw" | "se"; cx: number; cy: number }[] = [
      { corner: "nw", cx: Number(slot.x), cy: Number(slot.y) },
      { corner: "ne", cx: Number(slot.x) + Number(slot.width), cy: Number(slot.y) },
      { corner: "sw", cx: Number(slot.x), cy: Number(slot.y) + Number(slot.height) },
      { corner: "se", cx: Number(slot.x) + Number(slot.width), cy: Number(slot.y) + Number(slot.height) },
    ];
    for (const c of corners) {
      if (Math.abs(mxUnscaled - c.cx) <= hs && Math.abs(myUnscaled - c.cy) <= hs) {
        return c.corner;
      }
    }
    return null;
  }

  function getCanvasMouse(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const s = scaleRef.current;
    return {
      mx: (e.clientX - rect.left) / s,
      my: (e.clientY - rect.top) / s,
    };
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { mx, my } = getCanvasMouse(e);

    // Check resize handles on selected slot first
    if (selectedSlot !== null) {
      const slot = slots[selectedSlot];
      const corner = getResizeCorner(mx, my, slot);
      if (corner) {
        setDragMode("resize");
        setResizeCorner(corner);
        dragStartRef.current = {
          mx, my,
          slot: { x: Number(slot.x), y: Number(slot.y), width: Number(slot.width), height: Number(slot.height) },
        };
        return;
      }
    }

    // Check if click on any slot (including resize handle area)
    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i];
      if (mx >= Number(s.x) && mx <= Number(s.x) + Number(s.width) &&
          my >= Number(s.y) && my <= Number(s.y) + Number(s.height)) {
        setSelectedSlot(i);
        setDragMode("move");
        setResizeCorner(null);
        dragStartRef.current = {
          mx, my,
          slot: { x: Number(s.x), y: Number(s.y), width: Number(s.width), height: Number(s.height) },
        };
        return;
      }
    }

    // Click on empty area — deselect
    setSelectedSlot(null);
    setDragMode(null);
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragMode || selectedSlot === null || !dragStartRef.current) return;
    const { mx, my } = getCanvasMouse(e);
    const ds = dragStartRef.current;
    const dx = mx - ds.mx;
    const dy = my - ds.my;

    setSlots(prev => prev.map((slot, i) => {
      if (i !== selectedSlot) return slot;

      if (dragMode === "move") {
        return {
          ...slot,
          x: Math.round(ds.slot.x + dx),
          y: Math.round(ds.slot.y + dy),
        };
      }

      if (dragMode === "resize") {
        const r = resizeCorner!;
        let { x, y, width, height } = ds.slot;

        if (r === "nw") {
          x += dx; y += dy; width -= dx; height -= dy;
        } else if (r === "ne") {
          y += dy; width += dx; height -= dy;
        } else if (r === "sw") {
          x += dx; width -= dx; height += dy;
        } else if (r === "se") {
          width += dx; height += dy;
        }

        if (width < MIN_SLOT_SIZE) width = MIN_SLOT_SIZE;
        if (height < MIN_SLOT_SIZE) height = MIN_SLOT_SIZE;

        return {
          ...slot,
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        };
      }

      return slot;
    }));
  }

  function handleCanvasMouseUp() {
    setDragMode(null);
    setResizeCorner(null);
    dragStartRef.current = null;
  }

  function handleCanvasMouseLeave() {
    // Stop drag if mouse leaves canvas
    if (dragMode) {
      handleCanvasMouseUp();
    }
  }

  function getCursorStyle(): string {
    if (dragMode) return "grabbing";
    if (selectedSlot !== null) return "move";
    return "crosshair";
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

  async function handleUpdateDetail() {
    if (onUpdateDetail) {
      await onUpdateDetail(name, category, additionalFee);
      setDetailSaved(true);
      setTimeout(() => setDetailSaved(false), 2000);
    }
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          style={{ cursor: getCursorStyle() }}
          className="border-2 border-amber/10 rounded-2xl max-w-full shadow-lg shadow-amber/5 select-none"
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
          {dragMode ? "Geser / atur ukuran slot..." : "Klik & geser slot untuk memindahkan · Tarik sudut untuk mengatur ukuran"} &bull; Dimensi frame: {frameWidth} × {frameHeight}px
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

        {mode === "edit" && onUpdateDetail && (
          <>
            {frameUrl && (
              <div>
                <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                  Preview Frame
                </label>
                <div className="bg-cream-card rounded-xl border border-amber/10 overflow-hidden p-2">
                  <img
                    src={frameUrl}
                    alt={name}
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                Nama Frame
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
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
            <button
              onClick={handleUpdateDetail}
              className="w-full bg-amber text-espresso rounded-xl py-3 text-sm font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10"
            >
              {detailSaved ? "✓ Tersimpan" : "Simpan Detail"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
