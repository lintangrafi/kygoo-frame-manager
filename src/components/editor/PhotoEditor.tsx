"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Download } from "lucide-react";

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
}

interface Photo {
  id: string;
  fileUrl: string;
  originalName: string;
}

interface PhotoEditorProps {
  compositionId: string;
  frameUrl: string;
  frameWidth: number;
  frameHeight: number;
  slots: Slot[];
  allocations: Allocation[];
  photos: Photo[];
  readOnly: boolean;
}

export function PhotoEditor({ compositionId, frameUrl, frameWidth, frameHeight, slots, allocations: initialAllocs, photos, readOnly }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [allocations, setAllocations] = useState(initialAllocs);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const SCALE = Math.min(1, 800 / Math.max(frameWidth, frameHeight));
  const canvasW = frameWidth * SCALE;
  const canvasH = frameHeight * SCALE;

  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // --- LAYER SYSTEM ala LumaBooth/BoothLab.id ---
    // Layer 1 (bawah): Foto di-clip ke area slot
    // Layer 2 (atas): Frame PNG transparan — lubang transparan expose foto
    //                  area non-transparan (dekorasi/border) nutup tepi foto

    // Load & draw photos FIRST (layer bawah)
    for (const slot of slots) {
      const alloc = allocations.find(a => a.slotId === slot.id);
      if (!alloc) continue;

      const photo = photos.find(p => p.id === alloc.photoId);
      if (!photo) continue;

      if (!imageCache.current.has(photo.fileUrl)) {
        await new Promise<void>(resolve => {
          const img = new Image();
          img.onload = () => { imageCache.current.set(photo.fileUrl, img); resolve(); };
          img.src = photo.fileUrl;
        });
      }
      const photoImg = imageCache.current.get(photo.fileUrl)!;

      const slotX = Number(slot.x) * SCALE;
      const slotY = Number(slot.y) * SCALE;
      const slotW = Number(slot.width) * SCALE;
      const slotH = Number(slot.height) * SCALE;

      const scale = Number(alloc.scale);
      const scaledW = slotW * scale;
      const scaledH = slotH * scale;
      const centerX = slotX + slotW / 2;
      const centerY = slotY + slotH / 2;
      const drawX = centerX - scaledW / 2 + Number(alloc.offsetX) * SCALE;
      const drawY = centerY - scaledH / 2 + Number(alloc.offsetY) * SCALE;

      ctx.filter = `hue-rotate(${alloc.hue}deg) saturate(${alloc.saturation}%) brightness(${alloc.brightness}%) contrast(${alloc.contrast}%)`;

      // Clip foto ke area slot (tidak boleh keluar dari lubang frame)
      ctx.save();
      ctx.beginPath();
      ctx.rect(slotX, slotY, slotW, slotH);
      ctx.clip();
      ctx.drawImage(photoImg, drawX, drawY, scaledW, scaledH);
      ctx.restore();
      ctx.filter = "none";
    }

    // Load & draw frame on TOP (layer atas — area transparan expose foto)
    if (!imageCache.current.has(frameUrl)) {
      await new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => { imageCache.current.set(frameUrl, img); resolve(); };
        img.src = frameUrl;
      });
    }
    ctx.drawImage(imageCache.current.get(frameUrl)!, 0, 0, canvasW, canvasH);

    // Slot highlight untuk slot terpilih (hanya border, tanpa fill — jangan tutup frame)
    if (selectedSlotIdx !== null && slots[selectedSlotIdx]) {
      const slot = slots[selectedSlotIdx];
      const slotX = Number(slot.x) * SCALE;
      const slotY = Number(slot.y) * SCALE;
      const slotW = Number(slot.width) * SCALE;
      const slotH = Number(slot.height) * SCALE;

      ctx.strokeStyle = "#D4872B";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(slotX, slotY, slotW, slotH);
      ctx.setLineDash([]);

      // Label highlight di atas
      ctx.fillStyle = "rgba(212, 135, 43, 0.9)";
      const labelText = `Slot ${slot.slotNumber}`;
      ctx.font = `600 ${11 * SCALE}px 'Plus Jakarta Sans', sans-serif`;
      const labelW = ctx.measureText(labelText).width + 12;
      ctx.beginPath();
      ctx.roundRect(slotX + 4, slotY + 4, labelW, 20 * SCALE, 4);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(labelText, slotX + 10, slotY + 16);
    }
  }, [frameUrl, frameWidth, frameHeight, slots, allocations, photos, selectedSlotIdx, SCALE, canvasW, canvasH]);

  useEffect(() => { draw(); }, [draw]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / SCALE;
    const my = (e.clientY - rect.top) / SCALE;

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

  function assignPhoto(photoId: string) {
    const slot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null;
    if (!slot) return;

    const existing = allocations.find(a => a.slotId === slot.id);
    if (existing) {
      setAllocations(prev => prev.map(a => a.slotId === slot.id ? { ...a, photoId } : a));
    } else {
      // Slot belum punya allocation — buat baru dan auto-assign
      setAllocations(prev => [...prev, {
        id: `temp-${slot.id}-${photoId}`,
        slotId: slot.id,
        photoId,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        hue: 0,
        saturation: 100,
        brightness: 100,
        contrast: 100,
      }]);
    }
  }

  /** Place photo ke slot kosong pertama yang belum terassign */
  function autoPlacePhoto(photoId: string) {
    // Cari slot pertama yang belum punya allocation
    const allocSlots = new Set(allocations.map(a => a.slotId));
    const emptySlot = slots.find(s => !allocSlots.has(s.id));
    if (!emptySlot) return;

    // Isi slot kosong
    setAllocations(prev => [...prev, {
      id: `temp-${emptySlot.id}-${photoId}`,
      slotId: emptySlot.id,
      photoId,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      hue: 0,
      saturation: 100,
      brightness: 100,
      contrast: 100,
    }]);
  }

  function updateAllocation(field: string, value: number) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];
    setAllocations(prev => prev.map(a => a.slotId === slot.id ? { ...a, [field]: value } : a));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/compositions/${compositionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocations }),
    });
    const data = await res.json();
    // Ganti temp-ids dengan real IDs dari server
    if (data._savedAllocations) {
      setAllocations(prev => prev.map(a => {
        const saved = data._savedAllocations.find((s: any) => s.id === a.id || (a.id.startsWith("temp-") && s.slotId === a.slotId));
        return saved ? { ...a, id: saved.id || a.id } : a;
      }));
    }
    setSaving(false);
  }

  async function download() {
    await save();
    const res = await fetch(`/api/compositions/${compositionId}/export`, { method: "POST" });
    const { exportUrl } = await res.json();
    window.open(exportUrl, "_blank");
  }

  const selectedSlot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null;
  const selectedAlloc = selectedSlot ? allocations.find(a => a.slotId === selectedSlot.id) : null;

  // Hitung slot mana saja yang sudah terisi
  const filledSlots = new Set(allocations.map(a => a.slotId));
  const emptySlotCount = slots.filter(s => !filledSlots.has(s.id)).length;

  return (
    <div className="flex gap-6 p-6 bg-cream min-h-screen">
      {/* Canvas */}
      <div className="flex-1 flex items-start justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="border-2 border-amber/10 rounded-2xl cursor-crosshair max-h-[80vh] shadow-2xl shadow-amber/5"
        />
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
                    onClick={() => {
                      // Auto-place: foto langsung masuk ke slot kosong pertama
                      // Kalau semua slot sudah penuh, assign ke slot terpilih
                      const filledSlotsSet = new Set(allocations.map(a => a.slotId));
                      const hasEmptySlot = slots.some(s => !filledSlotsSet.has(s.id));
                      if (hasEmptySlot && selectedSlotIdx === null) {
                        autoPlacePhoto(photo.id);
                      } else if (selectedSlotIdx !== null) {
                        assignPhoto(photo.id);
                      } else {
                        // No slot selected, auto-place ke slot kosong pertama
                        autoPlacePhoto(photo.id);
                      }
                    }}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-amber/10 hover:border-amber shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber/10"
                  >
                    <img src={photo.fileUrl} alt={photo.originalName} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {emptySlotCount > 0 && (
                <p className="mt-2 text-[11px] text-mahogany/40 text-center">
                  {emptySlotCount} slot kosong &mdash; klik foto untuk auto-place
                </p>
              )}
            </div>

            {selectedAlloc && (
              <div className="bg-cream-card rounded-2xl p-4 border border-amber/5 shadow-sm space-y-4">
                <div className="text-xs font-bold text-amber uppercase tracking-wider">
                  Penyesuaian — Slot {selectedSlot?.slotNumber}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Zoom ({Math.round(Number(selectedAlloc.scale) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.5" max="3" step="0.01"
                    value={Number(selectedAlloc.scale)}
                    onChange={e => updateAllocation("scale", parseFloat(e.target.value))}
                    className="w-full accent-amber mt-1"
                  />
                </div>
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
                    Saturation ({selectedAlloc.saturation}%)
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
                    Brightness ({selectedAlloc.brightness}%)
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
                    Contrast ({selectedAlloc.contrast}%)
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
              href={allocations[0] ? "#" : "#"}
              download
              className="flex items-center justify-center gap-2 w-full bg-amber text-espresso rounded-xl py-3 text-sm font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10"
            >
              <Download className="w-4 h-4" />
              Unduh PNG
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
