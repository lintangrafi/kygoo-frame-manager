"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Plus, Trash2, Save, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";

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
const GRID_SIZE = 20;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.5;

export function FrameSlotEditor({
  frameUrl, frameWidth, frameHeight, initialSlots, onSave, onUpload, mode,
  initialName = "", initialCategory = "2R", initialAdditionalFee = 0,
  onUpdateDetail,
}: FrameSlotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [additionalFee, setAdditionalFee] = useState(initialAdditionalFee);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [detailSaved, setDetailSaved] = useState(false);

  // Viewport state (zoom/pan)
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // Drag / resize state
  const [dragMode, setDragMode] = useState<"move" | "resize" | "create" | null>(null);
  const [resizeCorner, setResizeCorner] = useState<"nw" | "ne" | "sw" | "se" | null>(null);
  const dragStartRef = useRef<{ mx: number; my: number; slot: { x: number; y: number; width: number; height: number } } | null>(null);
  const createStartRef = useRef<{ x: number; y: number } | null>(null);

  // Image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const drawTokenRef = useRef(0); // Token to track current draw operation

  const getScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const containerWidth = containerRef.current.clientWidth - 32; // padding
    const containerHeight = containerRef.current.clientHeight - 32;
    return Math.min(zoom, containerWidth / frameWidth, containerHeight / frameHeight, 2);
  }, [zoom, frameWidth, frameHeight]);

  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  scaleRef.current = scale;

  useEffect(() => {
    const newScale = getScale();
    setScale(newScale);
    scaleRef.current = newScale;
  }, [getScale]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = scaleRef.current;

    canvas.width = frameWidth * s;
    canvas.height = frameHeight * s;

    // Apply pan offset
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    // Background
    ctx.fillStyle = "#FEFAF3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid pattern
    if (mode === "create" && !uploadedPreview && !frameUrl) {
      ctx.strokeStyle = "rgba(212, 135, 43, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += GRID_SIZE * s) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += GRID_SIZE * s) {
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
      ctx.font = `${14 * s}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Upload file PNG frame di panel kanan", canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Dimensi: ${frameWidth} × ${frameHeight}px`, canvas.width / 2, canvas.height / 2 + 24);
      ctx.textAlign = "start";
    }

    const imgSrc = uploadedPreview || (frameUrl || undefined);
    if (imgSrc && imageLoaded) {
      const currentToken = ++drawTokenRef.current; // Increment token for this draw operation
      const img = new Image();
      img.onload = () => {
        // Only draw if this is still the current draw operation
        if (currentToken !== drawTokenRef.current) return;
        ctx.clearRect(-panOffset.x / s, -panOffset.y / s, canvas.width / s, canvas.height / s);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawSlots(ctx, s);
      };
      img.onerror = () => {
        if (currentToken !== drawTokenRef.current) return;
        setImageError(true);
        drawSlots(ctx, s);
      };
      img.src = imgSrc;
    } else {
      drawSlots(ctx, s);
    }

    ctx.restore();
  }, [frameUrl, uploadedPreview, frameWidth, frameHeight, slots, selectedSlot, scale, panOffset, mode, imageLoaded]);

  function drawSlots(ctx: CanvasRenderingContext2D, s: number) {
    slots.forEach((slot, i) => {
      const x = Number(slot.x) * s;
      const y = Number(slot.y) * s;
      const w = Number(slot.width) * s;
      const h = Number(slot.height) * s;
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
      ctx.font = `600 ${11 * s}px 'Plus Jakarta Sans', sans-serif`;
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

  useEffect(() => {
    if (uploadedPreview || frameUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = uploadedPreview || frameUrl || "";
    } else {
      setImageLoaded(true);
    }
  }, [uploadedPreview, frameUrl]);

  useEffect(() => { draw(); }, [draw]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setImageError(false);
    if (selected) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedPreview(reader.result as string);
        setImageLoaded(false);
      };
      reader.readAsDataURL(selected);
    }
  }

  function getCanvasMouse(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const s = scaleRef.current;
    return {
      mx: (e.clientX - rect.left - panOffset.x) / s,
      my: (e.clientY - rect.top - panOffset.y) / s,
    };
  }

  function getResizeCorner(mxUnscaled: number, myUnscaled: number, slot: Slot): "nw" | "ne" | "sw" | "se" | null {
    const hs = HANDLE_SIZE / scaleRef.current;
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

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { mx, my } = getCanvasMouse(e);

    // Middle mouse button or space+click for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: panOffset.x, offsetY: panOffset.y };
      return;
    }

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

    // Check if click on any slot
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

    // Click on empty area — start creating a new slot
    setSelectedSlot(null);
    setDragMode("create");
    setResizeCorner(null);
    createStartRef.current = { x: mx, y: my };
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    // Handle panning
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.offsetX + dx,
        y: panStartRef.current.offsetY + dy,
      });
      return;
    }

    if (!dragMode) return;

    const { mx, my } = getCanvasMouse(e);

    if (dragMode === "create" && createStartRef.current) {
      // Draw preview of new slot
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const startX = Math.min(createStartRef.current.x, mx);
      const startY = Math.min(createStartRef.current.y, my);
      const width = Math.abs(mx - createStartRef.current.x);
      const height = Math.abs(my - createStartRef.current.y);

      // Redraw to show preview
      draw();

      // Draw preview rectangle
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.strokeStyle = "#D4872B";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX * scaleRef.current, startY * scaleRef.current, width * scaleRef.current, height * scaleRef.current);
      ctx.fillStyle = "rgba(212, 135, 43, 0.1)";
      ctx.fillRect(startX * scaleRef.current, startY * scaleRef.current, width * scaleRef.current, height * scaleRef.current);
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    if (selectedSlot === null || !dragStartRef.current) return;

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

  function handleCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragMode === "create" && createStartRef.current) {
      const { mx, my } = getCanvasMouse(e);
      const startX = Math.min(createStartRef.current.x, mx);
      const startY = Math.min(createStartRef.current.y, my);
      const width = Math.abs(mx - createStartRef.current.x);
      const height = Math.abs(my - createStartRef.current.y);

      // Only create slot if it's large enough
      if (width >= MIN_SLOT_SIZE && height >= MIN_SLOT_SIZE) {
        const newSlot: Slot = {
          slotNumber: slots.length + 1,
          x: Math.round(startX),
          y: Math.round(startY),
          width: Math.round(width),
          height: Math.round(height),
          rotation: 0,
        };
        setSlots(prev => [...prev, newSlot]);
        setSelectedSlot(slots.length);
      }
    }

    setDragMode(null);
    setResizeCorner(null);
    dragStartRef.current = null;
    createStartRef.current = null;
  }

  function handleCanvasMouseLeave() {
    if (dragMode === "create" && createStartRef.current) {
      // Cancel create if mouse leaves canvas
      setDragMode(null);
      createStartRef.current = null;
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  }

  function handleZoomIn() {
    setZoom(prev => Math.min(MAX_ZOOM, prev + 0.25));
  }

  function handleZoomOut() {
    setZoom(prev => Math.max(MIN_ZOOM, prev - 0.25));
  }

  function handleResetView() {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
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

  // Move slot up/down in order
  function moveSlotUp() {
    if (selectedSlot === null || selectedSlot === 0) return;
    const newSlots = [...slots];
    [newSlots[selectedSlot - 1], newSlots[selectedSlot]] = [newSlots[selectedSlot], newSlots[selectedSlot - 1]];
    newSlots.forEach((s, i) => s.slotNumber = i + 1);
    setSlots(newSlots);
    setSelectedSlot(selectedSlot - 1);
  }

  function moveSlotDown() {
    if (selectedSlot === null || selectedSlot === slots.length - 1) return;
    const newSlots = [...slots];
    [newSlots[selectedSlot], newSlots[selectedSlot + 1]] = [newSlots[selectedSlot + 1], newSlots[selectedSlot]];
    newSlots.forEach((s, i) => s.slotNumber = i + 1);
    setSlots(newSlots);
    setSelectedSlot(selectedSlot + 1);
  }

  async function handleUpdateDetail() {
    if (onUpdateDetail) {
      await onUpdateDetail(name, category, additionalFee);
      setDetailSaved(true);
      setTimeout(() => setDetailSaved(false), 2000);
    }
  }

  function getCursorStyle(): string {
    if (isPanning) return "grabbing";
    if (dragMode === "create") return "crosshair";
    if (dragMode === "move") return "grabbing";
    if (selectedSlot !== null) return "move";
    if (uploadedPreview || frameUrl) return "default";
    return "crosshair";
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1" ref={containerRef}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3 bg-cream-card rounded-xl p-2 border border-amber/5">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-lg hover:bg-cream transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-mahogany/50" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-lg hover:bg-cream transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-mahogany/50" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset View"
            className="p-2 rounded-lg hover:bg-cream transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-mahogany/50" />
          </button>
          <div className="h-6 w-px bg-amber/10 mx-1" />
          <span className="text-xs text-mahogany/30 font-medium">
            {Math.round(scale * 100)}%
          </span>
          <div className="h-6 w-px bg-amber/10 mx-1" />
          <span className="text-xs text-mahogany/30">
            Alt+Drag untuk pan
          </span>
        </div>

        {/* Canvas */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber/10 shadow-lg shadow-amber/5 bg-cream">
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
            onWheel={handleWheel}
            style={{
              cursor: getCursorStyle(),
              maxHeight: "60vh"
            }}
            className="max-w-full select-none"
          />
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-cream/80">
              <p className="text-mahogany/50 text-sm">Gagal memuat gambar</p>
            </div>
          )}
        </div>

        {/* Actions */}
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
          {selectedSlot !== null && (
            <>
              <button
                onClick={moveSlotUp}
                disabled={selectedSlot === 0}
                className="flex items-center gap-1.5 bg-cream text-mahogany/50 px-3 py-2 rounded-xl text-xs font-bold border border-amber/10 hover:border-amber/20 disabled:opacity-30 transition-all duration-200"
              >
                ↑
              </button>
              <button
                onClick={moveSlotDown}
                disabled={selectedSlot === slots.length - 1}
                className="flex items-center gap-1.5 bg-cream text-mahogany/50 px-3 py-2 rounded-xl text-xs font-bold border border-amber/10 hover:border-amber/20 disabled:opacity-30 transition-all duration-200"
              >
                ↓
              </button>
            </>
          )}
          <button
            onClick={() => onSave(slots)}
            className="flex items-center gap-1.5 bg-amber text-espresso px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10 ml-auto"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Layout
          </button>
        </div>
        <p className="mt-2 text-[11px] text-mahogany/30 text-center">
          {dragMode === "create"
            ? "Tarik untuk membuat slot baru..."
            : dragMode === "move"
            ? "Geser untuk memindahkan slot..."
            : dragMode === "resize"
            ? "Tarik sudut untuk mengatur ukuran..."
            : "Klik & drag untuk membuat slot · Klik slot untuk memilih · Alt+drag untuk pan"}
          &bull; Dimensi: {frameWidth} × {frameHeight}px
        </p>
      </div>

      {/* Side Panel */}
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

            {/* Slot info panel */}
            {selectedSlot !== null && slots[selectedSlot] && (
              <div className="bg-cream-card rounded-xl p-4 border border-amber/5 space-y-3">
                <div className="text-xs font-bold text-amber uppercase tracking-wider">
                  Slot {slots[selectedSlot].slotNumber}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-mahogany/40">X:</span>
                    <span className="ml-1 font-mono">{slots[selectedSlot].x}</span>
                  </div>
                  <div>
                    <span className="text-mahogany/40">Y:</span>
                    <span className="ml-1 font-mono">{slots[selectedSlot].y}</span>
                  </div>
                  <div>
                    <span className="text-mahogany/40">W:</span>
                    <span className="ml-1 font-mono">{slots[selectedSlot].width}</span>
                  </div>
                  <div>
                    <span className="text-mahogany/40">H:</span>
                    <span className="ml-1 font-mono">{slots[selectedSlot].height}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
