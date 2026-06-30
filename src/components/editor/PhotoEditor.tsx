"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Download, Undo2, Redo2, RotateCw, Move, ZoomIn, ZoomOut, Crop, Sliders, Eye, EyeOff } from "lucide-react";
import { CropTool } from "./CropTool";
import { FilterPresets } from "./FilterPresets";

interface Slot {
  id: string;
  slotNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Allocation {
  id: string;
  slotId: string;
  photoId: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  rotation: number;
  // Crop data
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

interface Photo {
  id: string;
  fileUrl: string;
  originalName: string;
}

interface PhotoEditorProps {
  compositionId: string;
  comp?: { id: string; exportUrl: string | null; status: string };
  frameUrl: string;
  frameWidth: number;
  frameHeight: number;
  slots: Slot[];
  allocations: Allocation[];
  photos: Photo[];
  readOnly: boolean;
}

const MAX_HISTORY = 50;

export function PhotoEditor({ compositionId, comp, frameUrl, frameWidth, frameHeight, slots, allocations: initialAllocs, photos, readOnly }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [allocations, setAllocations] = useState<Allocation[]>(initialAllocs);
  const [history, setHistory] = useState<Allocation[][]>([initialAllocs]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mx: number; my: number; offsetX: number; offsetY: number } | null>(null);

  // Crop mode state
  const [showCropTool, setShowCropTool] = useState(false);
  const [cropMode, setCropMode] = useState<"free" | "square" | "portrait" | "landscape">("free");
  const [showPresets, setShowPresets] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const SCALE = Math.min(1, 800 / Math.max(frameWidth, frameHeight));
  const canvasW = frameWidth * SCALE;
  const canvasH = frameHeight * SCALE;

  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Undo/Redo functions
  const pushHistory = useCallback((newAllocations: Allocation[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newAllocations]);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAllocations([...history[newIndex]]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAllocations([...history[newIndex]]);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Apply filter preset
  function applyPreset(preset: { hue: number; saturation: number; brightness: number; contrast: number }) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];
    updateAllocation("hue", preset.hue);
    updateAllocation("saturation", preset.saturation);
    updateAllocation("brightness", preset.brightness);
    updateAllocation("contrast", preset.contrast);
  }

  // Reset to original
  function resetToOriginal() {
    applyPreset({ hue: 0, saturation: 100, brightness: 100, contrast: 100 });
  }

  // Apply crop
  function applyCrop(crop: { x: number; y: number; width: number; height: number }) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];

    const updated = allocations.map(a => {
      if (a.slotId === slot.id) {
        return {
          ...a,
          cropX: crop.x,
          cropY: crop.y,
          cropWidth: crop.width,
          cropHeight: crop.height,
        };
      }
      return a;
    });

    pushHistory(updated);
    setAllocations(updated);
    setShowCropTool(false);
  }

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasW;
    canvas.height = canvasH;

    if (!imageCache.current.has(frameUrl)) {
      await new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => { imageCache.current.set(frameUrl, img); resolve(); };
        img.src = frameUrl;
      });
    }
    ctx.drawImage(imageCache.current.get(frameUrl)!, 0, 0, canvasW, canvasH);

    for (const slot of slots) {
      const alloc = allocations.find(a => a.slotId === slot.id);
      const photo = alloc?.photoId ? photos.find(p => p.id === alloc.photoId) : null;

      const slotX = Number(slot.x) * SCALE;
      const slotY = Number(slot.y) * SCALE;
      const slotW = Number(slot.width) * SCALE;
      const slotH = Number(slot.height) * SCALE;
      const isSelected = selectedSlotIdx === slots.indexOf(slot);

      if (photo && alloc) {
        // Draw photo in slot
        if (!imageCache.current.has(photo.fileUrl)) {
          await new Promise<void>(resolve => {
            const img = new Image();
            img.onload = () => { imageCache.current.set(photo.fileUrl, img); resolve(); };
            img.src = photo.fileUrl;
          });
        }
        const photoImg = imageCache.current.get(photo.fileUrl)!;

        const scale = Number(alloc.scale);
        const scaledW = slotW * scale;
        const scaledH = slotH * scale;
        const centerX = slotX + slotW / 2;
        const centerY = slotY + slotH / 2;

        // Apply rotation
        const rotation = Number(alloc.rotation) || 0;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);

        // Calculate draw position (centered with offset)
        const drawX = -scaledW / 2 + Number(alloc.offsetX) * SCALE;
        const drawY = -scaledH / 2 + Number(alloc.offsetY) * SCALE;

        // Clip to slot area
        ctx.beginPath();
        ctx.rect(-slotW / 2, -slotH / 2, slotW, slotH);
        ctx.clip();

        // Apply filters
        ctx.filter = `hue-rotate(${alloc.hue}deg) saturate(${alloc.saturation}%) brightness(${alloc.brightness}%) contrast(${alloc.contrast}%)`;

        ctx.drawImage(photoImg, drawX, drawY, scaledW, scaledH);
        ctx.restore();
        ctx.filter = "none";
      } else {
        // Draw empty slot indicator
        ctx.fillStyle = isSelected ? "rgba(212, 135, 43, 0.2)" : "rgba(212, 135, 43, 0.1)";
        ctx.fillRect(slotX, slotY, slotW, slotH);

        // Draw "no photo" text
        ctx.fillStyle = isSelected ? "rgba(212, 135, 43, 0.6)" : "rgba(212, 135, 43, 0.4)";
        ctx.font = `${12 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Pilih Foto", slotX + slotW / 2, slotY + slotH / 2);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }

      // Draw slot border
      ctx.strokeStyle = isSelected ? "#D4872B" : "rgba(92,45,26,0.3)";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.setLineDash(isSelected ? [] : [4, 4]);
      ctx.strokeRect(slotX, slotY, slotW, slotH);
      ctx.setLineDash([]);

      if (isSelected) {
        ctx.fillStyle = "rgba(212,135,43,0.05)";
        ctx.fillRect(slotX, slotY, slotW, slotH);

        // Slot label
        ctx.fillStyle = "#2D1810";
        ctx.font = `600 ${11 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(`Slot ${slot.slotNumber}`, slotX + 6, slotY + 16);

        // Drag indicator if photo is assigned
        if (alloc?.photoId) {
          ctx.fillStyle = "rgba(212, 135, 43, 0.3)";
          ctx.beginPath();
          ctx.arc(slotX + slotW / 2, slotY + slotH / 2, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#D4872B";
          ctx.font = `${14 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⇔", slotX + slotW / 2, slotY + slotH / 2);
          ctx.textAlign = "start";
          ctx.textBaseline = "alphabetic";
        }
      }
    }
  }, [frameUrl, slots, allocations, photos, selectedSlotIdx, SCALE, canvasW, canvasH]);

  useEffect(() => { draw(); }, [draw]);

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / SCALE;
    const my = (e.clientY - rect.top) / SCALE;

    // Check if clicking on a slot with allocated photo
    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i];
      const alloc = allocations.find(a => a.slotId === s.id);
      if (alloc?.photoId &&
          mx >= Number(s.x) && mx <= Number(s.x) + Number(s.width) &&
          my >= Number(s.y) && my <= Number(s.y) + Number(s.height)) {
        setSelectedSlotIdx(i);
        setIsDragging(true);
        dragStartRef.current = {
          mx,
          my,
          offsetX: Number(alloc.offsetX),
          offsetY: Number(alloc.offsetY),
        };
        return;
      }
    }

    // Check if clicking on empty slot
    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i];
      if (mx >= Number(s.x) && mx <= Number(s.x) + Number(s.width) &&
          my >= Number(s.y) && my <= Number(s.y) + Number(s.height)) {
        setSelectedSlotIdx(i);
        return;
      }
    }
    setSelectedSlotIdx(null);
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDragging || selectedSlotIdx === null || !dragStartRef.current) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / SCALE;
    const my = (e.clientY - rect.top) / SCALE;

    const dx = mx - dragStartRef.current.mx;
    const dy = my - dragStartRef.current.my;

    const slot = slots[selectedSlotIdx];
    setAllocations(prev => prev.map(a => {
      if (a.slotId === slot.id) {
        return { ...a, offsetX: dragStartRef.current!.offsetX + dx, offsetY: dragStartRef.current!.offsetY + dy };
      }
      return a;
    }));
  }

  function handleCanvasMouseUp() {
    if (isDragging && selectedSlotIdx !== null) {
      // Push to history after drag ends
      setAllocations(prev => {
        pushHistory(prev);
        return prev;
      });
    }
    setIsDragging(false);
    dragStartRef.current = null;
  }

  async function assignPhoto(photoId: string) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];
    const existing = allocations.find(a => a.slotId === slot.id);

    if (existing) {
      const updated = allocations.map(a => a.slotId === slot.id ? { ...a, photoId } : a);
      pushHistory(updated);
      setAllocations(updated);
    } else {
      // Create new allocation via API
      const res = await fetch(`/api/compositions/${compositionId}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, photoId }),
      });
      if (res.ok) {
        const newAlloc = await res.json();
        const newAllocs = [...allocations, {
          id: newAlloc.id,
          slotId: newAlloc.slotId,
          photoId,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          hue: 0,
          saturation: 100,
          brightness: 100,
          contrast: 100,
          rotation: 0,
        }];
        pushHistory(newAllocs);
        setAllocations(newAllocs);
      }
    }
  }

  function updateAllocation(field: string, value: number) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];

    const updated = allocations.map(a => {
      if (a.slotId === slot.id) {
        return { ...a, [field]: value };
      }
      return a;
    });

    pushHistory(updated);
    setAllocations(updated);
  }

  function rotatePhoto(degrees: number) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];
    const alloc = allocations.find(a => a.slotId === slot.id);
    if (!alloc) return;

    const currentRotation = Number(alloc.rotation) || 0;
    const newRotation = (currentRotation + degrees) % 360;
    updateAllocation("rotation", newRotation);
  }

  function resetAdjustment() {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];

    const updated = allocations.map(a => {
      if (a.slotId === slot.id) {
        return { ...a, scale: 1, offsetX: 0, offsetY: 0, hue: 0, saturation: 100, brightness: 100, contrast: 100, rotation: 0 };
      }
      return a;
    });

    pushHistory(updated);
    setAllocations(updated);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/compositions/${compositionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocations }),
    });
    setSaving(false);
  }

  async function download() {
    await save();
    const res = await fetch(`/api/compositions/${compositionId}/export`, { method: "POST" });
    const { exportUrl } = await res.json();

    if (!exportUrl) {
      alert("Gagal membuat export. Pastikan semua foto sudah dipilih.");
      return;
    }

    // Create a download link with the file URL
    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = `composition-${compositionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const selectedSlot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null;
  const selectedAlloc = selectedSlot ? allocations.find(a => a.slotId === selectedSlot.id) : null;

  return (
    <div className="flex gap-6 p-6 bg-cream min-h-screen">
      {/* Canvas */}
      <div className="flex-1 flex flex-col items-start justify-center">
        {/* Undo/Redo toolbar */}
        {!readOnly && (
          <div className="flex items-center gap-2 mb-3 bg-cream-card rounded-xl p-2 border border-amber/5">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              className="p-2 rounded-lg hover:bg-cream transition-colors disabled:opacity-30"
            >
              <Undo2 className="w-4 h-4 text-mahogany/50" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              className="p-2 rounded-lg hover:bg-cream transition-colors disabled:opacity-30"
            >
              <Redo2 className="w-4 h-4 text-mahogany/50" />
            </button>
            <div className="h-6 w-px bg-amber/10 mx-1" />
            <span className="text-xs text-mahogany/30">
              {historyIndex + 1}/{history.length}
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className={`border-2 border-amber/10 rounded-2xl cursor-crosshair max-h-[70vh] shadow-2xl shadow-amber/5 ${isDragging ? "cursor-grabbing" : ""}`}
        />

        {isDragging && (
          <p className="mt-2 text-xs text-mahogany/50 text-center">
            Geser untuk mengatur posisi foto
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="w-72 space-y-4">
        {!readOnly && (
          <>
            <div className="bg-cream-card rounded-2xl p-4 border border-amber/5 shadow-sm">
              <div className="text-xs font-bold text-mahogany/50 uppercase tracking-wider mb-3">
                Pilih Foto
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => assignPhoto(photo.id)}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-amber/10 hover:border-amber shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber/10"
                  >
                    <img src={photo.fileUrl} alt={photo.originalName} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {photos.length === 0 && (
                <p className="text-xs text-mahogany/30 text-center py-4">
                  Tidak ada foto tersedia
                </p>
              )}
            </div>

            {selectedAlloc && selectedAlloc.photoId && (
              <div className="bg-cream-card rounded-2xl p-4 border border-amber/5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber uppercase tracking-wider">
                    Penyesuaian — Slot {selectedSlot?.slotNumber}
                  </div>
                  <div className="flex gap-1">
                    {/* Compare button */}
                    <button
                      onClick={() => setShowCompare(!showCompare)}
                      className={`p-1.5 rounded-lg transition-colors ${showCompare ? "bg-amber text-espresso" : "bg-cream hover:bg-amber/10"}`}
                      title="Bandingkan"
                    >
                      {showCompare ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {/* Crop button */}
                    <button
                      onClick={() => setShowCropTool(true)}
                      className="p-1.5 rounded-lg bg-cream hover:bg-amber/10 transition-colors"
                      title="Crop Foto"
                    >
                      <Crop className="w-3.5 h-3.5 text-mahogany/50" />
                    </button>
                    {/* Presets toggle */}
                    <button
                      onClick={() => { setShowPresets(!showPresets); setShowFilters(false); }}
                      className={`p-1.5 rounded-lg transition-colors ${showPresets ? "bg-amber text-espresso" : "bg-cream hover:bg-amber/10"}`}
                      title="Filter Presets"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filter Presets */}
                {showPresets && (
                  <FilterPresets
                    currentValues={{
                      hue: selectedAlloc.hue,
                      saturation: selectedAlloc.saturation,
                      brightness: selectedAlloc.brightness,
                      contrast: selectedAlloc.contrast,
                    }}
                    onApplyPreset={applyPreset}
                    onReset={resetToOriginal}
                    isStaffMode={false}
                  />
                )}

                {/* Rotation controls */}
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Rotasi ({selectedAlloc.rotation || 0}°)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => rotatePhoto(-90)}
                      className="flex-1 p-2 bg-cream rounded-lg border border-amber/10 hover:border-amber transition-colors"
                      title="Putar -90°"
                    >
                      <RotateCw className="w-4 h-4 mx-auto text-mahogany/50 transform -scale-x-100" />
                    </button>
                    <button
                      onClick={() => rotatePhoto(15)}
                      className="flex-1 p-2 bg-cream rounded-lg border border-amber/10 hover:border-amber transition-colors text-xs font-bold"
                      title="Putar +15°"
                    >
                      +15°
                    </button>
                    <button
                      onClick={() => rotatePhoto(-15)}
                      className="flex-1 p-2 bg-cream rounded-lg border border-amber/10 hover:border-amber transition-colors text-xs font-bold"
                      title="Putar -15°"
                    >
                      -15°
                    </button>
                    <button
                      onClick={() => rotatePhoto(90)}
                      className="flex-1 p-2 bg-cream rounded-lg border border-amber/10 hover:border-amber transition-colors"
                      title="Putar +90°"
                    >
                      <RotateCw className="w-4 h-4 mx-auto text-mahogany/50" />
                    </button>
                  </div>
                </div>

                {/* Zoom with fine-tune buttons */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-mahogany/40">
                      Zoom ({Math.round(Number(selectedAlloc.scale) * 100)}%)
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateAllocation("scale", Math.max(0.5, Number(selectedAlloc.scale) - 0.05))}
                        className="px-2 py-0.5 bg-cream rounded border border-amber/10 hover:border-amber text-[10px] font-bold"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateAllocation("scale", Math.min(3, Number(selectedAlloc.scale) + 0.05))}
                        className="px-2 py-0.5 bg-cream rounded border border-amber/10 hover:border-amber text-[10px] font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5" max="3" step="0.01"
                    value={Number(selectedAlloc.scale)}
                    onChange={e => updateAllocation("scale", parseFloat(e.target.value))}
                    className="w-full accent-amber mt-1"
                  />
                </div>

                {/* Position Fine-tune */}
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Posisi X: {Math.round(Number(selectedAlloc.offsetX))}px
                  </label>
                  <input
                    type="range"
                    min="-100" max="100" step="1"
                    value={Number(selectedAlloc.offsetX)}
                    onChange={e => updateAllocation("offsetX", parseInt(e.target.value))}
                    className="w-full accent-amber mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Posisi Y: {Math.round(Number(selectedAlloc.offsetY))}px
                  </label>
                  <input
                    type="range"
                    min="-100" max="100" step="1"
                    value={Number(selectedAlloc.offsetY)}
                    onChange={e => updateAllocation("offsetY", parseInt(e.target.value))}
                    className="w-full accent-amber mt-1"
                  />
                </div>

                {/* Color adjustments - collapsible */}
                <div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold text-mahogany/40 hover:text-mahogany"
                  >
                    <span>Filter Warna {showFilters ? "▾" : "▸"}</span>
                    {showPresets && (
                      <span className="text-amber text-[10px]">Gunakan Preset</span>
                    )}
                  </button>
                  {showFilters && (
                    <div className="space-y-3 mt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-mahogany/40">
                          Hue ({selectedAlloc.hue}°)
                        </label>
                        <input
                          type="range"
                          min="-180" max="180"
                          value={Number(selectedAlloc.hue)}
                          onChange={e => updateAllocation("hue", parseInt(e.target.value))}
                          className="w-full accent-amber mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-mahogany/40">
                          Saturasi ({selectedAlloc.saturation}%)
                        </label>
                        <input
                          type="range"
                          min="0" max="200"
                          value={Number(selectedAlloc.saturation)}
                          onChange={e => updateAllocation("saturation", parseInt(e.target.value))}
                          className="w-full accent-amber mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-mahogany/40">
                          Kecerahan ({selectedAlloc.brightness}%)
                        </label>
                        <input
                          type="range"
                          min="0" max="200"
                          value={Number(selectedAlloc.brightness)}
                          onChange={e => updateAllocation("brightness", parseInt(e.target.value))}
                          className="w-full accent-amber mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-mahogany/40">
                          Kontras ({selectedAlloc.contrast}%)
                        </label>
                        <input
                          type="range"
                          min="0" max="200"
                          value={Number(selectedAlloc.contrast)}
                          onChange={e => updateAllocation("contrast", parseInt(e.target.value))}
                          className="w-full accent-amber mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Crop indicator */}
                {(selectedAlloc.cropX !== undefined || selectedAlloc.cropY !== undefined) && (
                  <div className="flex items-center gap-2 p-2 bg-amber/10 rounded-lg">
                    <Crop className="w-4 h-4 text-amber" />
                    <span className="text-[11px] text-amber">Crop aktif</span>
                    <button
                      onClick={() => {
                        const updated = allocations.map(a => {
                          if (a.slotId === selectedSlot?.id) {
                            return { ...a, cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100 };
                          }
                          return a;
                        });
                        pushHistory(updated);
                        setAllocations(updated);
                      }}
                      className="ml-auto text-[10px] text-amber hover:text-amber-glow"
                    >
                      Hapus Crop
                    </button>
                  </div>
                )}

                <button
                  onClick={resetAdjustment}
                  className="w-full py-2 text-xs font-semibold text-mahogany/40 hover:text-mahogany transition-colors"
                >
                  Reset ke Default
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-espresso text-cream rounded-xl py-3 text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5 disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={download}
                className="flex-1 flex items-center justify-center gap-2 bg-amber text-espresso rounded-xl py-3 text-sm font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10"
              >
                <Download className="w-4 h-4" />
                Unduh PNG
              </button>
            </div>
          </>
        )}

        {readOnly && (
          <div className="bg-cream-card rounded-2xl p-4 border border-amber/5 shadow-sm">
            <div className="text-xs font-bold text-mahogany/50 uppercase tracking-wider mb-3">
              Hasil Final
            </div>
            <a
              href={comp?.exportUrl || "#"}
              download
              className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 shadow-lg ${
                comp?.exportUrl
                  ? "bg-amber text-espresso hover:bg-amber-glow shadow-amber/10 hover:shadow-xl hover:shadow-amber/20 hover:-translate-y-0.5"
                  : "bg-mahogany/20 text-mahogany/30 cursor-not-allowed"
              }`}
            >
              <Download className="w-4 h-4" />
              {comp?.exportUrl ? "Unduh PNG" : "Export belum tersedia"}
            </a>
          </div>
        )}
      </div>

      {/* Crop Tool Modal */}
      {showCropTool && selectedAlloc && selectedSlot && (
        <CropTool
          imageUrl={photos.find(p => p.id === selectedAlloc.photoId)?.fileUrl || ""}
          slotWidth={Number(selectedSlot.width)}
          slotHeight={Number(selectedSlot.height)}
          initialCrop={
            selectedAlloc.cropX !== undefined && selectedAlloc.cropY !== undefined
              ? {
                  x: (selectedAlloc.cropX / 100) * Number(selectedSlot.width),
                  y: (selectedAlloc.cropY / 100) * Number(selectedSlot.height),
                  width: ((selectedAlloc.cropWidth || 100) / 100) * Number(selectedSlot.width),
                  height: ((selectedAlloc.cropHeight || 100) / 100) * Number(selectedSlot.height),
                }
              : null
          }
          onApply={applyCrop}
          onCancel={() => setShowCropTool(false)}
        />
      )}
    </div>
  );
}
