"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Save, Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

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
  /** Natural aspect ratio (width/height) */
  aspectRatio?: number;
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

/** Cache gambar global — shared antar instance */
const globalImageCache = new Map<string, HTMLImageElement>();
const globalLoadPromise = new Map<string, Promise<void>>();

function preloadImage(src: string): Promise<HTMLImageElement> {
  if (globalImageCache.has(src)) return Promise.resolve(globalImageCache.get(src)!);
  if (!globalLoadPromise.has(src)) {
    globalLoadPromise.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          globalImageCache.set(src, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load: ${src}`);
          resolve(); // don't block
        };
        img.src = src;
      })
    );
  }
  return globalLoadPromise.get(src)!.then(() => globalImageCache.get(src)!);
}

export function PhotoEditor({
  compositionId,
  frameUrl,
  frameWidth,
  frameHeight,
  slots,
  allocations: initialAllocs,
  photos,
  readOnly,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [allocations, setAllocations] = useState(initialAllocs);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [dragPhoto, setDragPhoto] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // Scale factor — fit canvas to viewport
  const SCALE = useMemo(
    () => Math.min(1, 800 / Math.max(frameWidth, frameHeight)),
    [frameWidth, frameHeight]
  );
  const canvasW = frameWidth * SCALE * zoom;
  const canvasH = frameHeight * SCALE * zoom;

  // ── Auto-Fit: compute best scale/offset to fit photo into slot ──
  function autoFit(slotW: number, slotH: number, photoW: number, photoH: number) {
    // Slot aspect ratio
    const slotAr = slotW / slotH;
    // Photo aspect ratio
    const photoAr = photoW / photoH;

    let scale: number;
    let offsetX: number;
    let offsetY: number;

    if (photoAr > slotAr) {
      // Photo lebih lebar dari slot → fit height, center horizontally
      scale = slotH / photoH;
      offsetX = (slotW - photoW * scale) / 2;
      offsetY = 0;
    } else {
      // Photo lebih tinggi dari slot → fit width, center vertically
      scale = slotW / photoW;
      offsetX = 0;
      offsetY = (slotH - photoH * scale) / 2;
    }

    return { scale, offsetX, offsetY, scaleW: photoW * scale, scaleH: photoH * scale };
  }

  // ── Render ──
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasW;
    canvas.height = canvasH;
    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Draw frame
    const frameImg = globalImageCache.get(frameUrl);
    if (frameImg) {
      ctx.drawImage(frameImg, 0, 0, canvasW, canvasH);
    } else {
      // Draw placeholder
      ctx.fillStyle = "#FEFAF3";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = "rgba(92,45,26,0.1)";
      ctx.font = `${14 * SCALE}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Memuat frame...", canvasW / 2, canvasH / 2);
      ctx.textAlign = "start";
    }

    // 2. Draw slots with auto-fit photos
    for (const slot of slots) {
      const alloc = allocations.find((a) => a.slotId === slot.id);
      if (!alloc) continue;

      const photo = photos.find((p) => p.id === alloc.photoId);
      if (!photo) continue;

      const photoImg = globalImageCache.get(photo.fileUrl);
      if (!photoImg) continue;

      const slotX = Number(slot.x) * SCALE * zoom;
      const slotY = Number(slot.y) * SCALE * zoom;
      const slotW = Number(slot.width) * SCALE * zoom;
      const slotH = Number(slot.height) * SCALE * zoom;

      // Auto-fit: compute best fit
      const fit = autoFit(
        slotW,
        slotH,
        photoImg.naturalWidth * SCALE * zoom,
        photoImg.naturalHeight * SCALE * zoom
      );

      const scale = Number(alloc.scale) * fit.scale;
      const offsetX = Number(alloc.offsetX) * SCALE * zoom;
      const offsetY = Number(alloc.offsetY) * SCALE * zoom;

      // ── Draw with clipping ──
      ctx.save();
      ctx.beginPath();
      ctx.rect(slotX, slotY, slotW, slotH);
      ctx.clip();

      // Center the photo in the slot
      const centerX = slotX + slotW / 2;
      const centerY = slotY + slotH / 2;
      const drawX = centerX - (photoImg.naturalWidth * scale * zoom) / 2 + offsetX;
      const drawY = centerY - (photoImg.naturalHeight * scale * zoom) / 2 + offsetY;

      ctx.drawImage(photoImg, drawX, drawY, photoImg.naturalWidth * scale * zoom, photoImg.naturalHeight * scale * zoom);
      ctx.restore();

      // ── Border ──
      const isSelected = selectedSlotIdx === slots.indexOf(slot);
      ctx.strokeStyle = isSelected ? "#D4872B" : "rgba(92,45,26,0.15)";
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.strokeRect(slotX, slotY, slotW, slotH);

      if (isSelected) {
        ctx.fillStyle = "rgba(212,135,43,0.05)";
        ctx.fillRect(slotX, slotY, slotW, slotH);
      }
    }
  }, [frameUrl, frameWidth, frameHeight, slots, allocations, photos, selectedSlotIdx, zoom, SCALE, canvasW, canvasH]);

  // Preload frame
  useEffect(() => {
    preloadImage(frameUrl).then(() => {
      setFrameLoaded(true);
      requestAnimationFrame(() => draw());
    });
    photos.forEach((p) => preloadImage(p.fileUrl));
  }, [frameUrl, photos, draw]);

  // Render loop with requestAnimationFrame
  useEffect(() => {
    if (!frameLoaded) return;
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, frameLoaded]);

  // ── Click handler ──
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / (SCALE * zoom);
    const my = (e.clientY - rect.top) / (SCALE * zoom);

    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i];
      if (mx >= Number(s.x) && mx <= Number(s.x) + Number(s.width) && my >= Number(s.y) && my <= Number(s.y) + Number(s.height)) {
        setSelectedSlotIdx(i);
        return;
      }
    }
    setSelectedSlotIdx(null);
  }

  function assignPhoto(photoId: string) {
    if (selectedSlotIdx === null) return;
    const slot = slots[selectedSlotIdx];
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    // Auto-fit on assign
    setAllocations((prev) => {
      const existing = prev.find((a) => a.slotId === slot.id);
      const base = existing || {
        id: crypto.randomUUID(),
        slotId: slot.id,
        photoId,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        hue: 0,
        saturation: 100,
        brightness: 100,
        contrast: 100,
      };
      return prev.map((a) => (a.slotId === slot.id ? { ...base, photoId } : a));
    });
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
    window.open(exportUrl, "_blank");
  }

  const selectedSlot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null;
  const selectedAlloc = selectedSlot ? allocations.find((a) => a.slotId === selectedSlot.id) : null;

  return (
    <div className="flex gap-6 p-6 bg-cream min-h-screen">
      {/* Canvas */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg bg-cream border border-amber/10 hover:bg-amber/5"
          >
            <ZoomOut className="w-4 h-4 text-mahogany/40" />
          </button>
          <span className="text-xs font-mono text-mahogany/30">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-lg bg-cream border border-amber/10 hover:bg-amber/5"
          >
            <ZoomIn className="w-4 h-4 text-mahogany/40" />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="border-2 border-amber/10 rounded-2xl cursor-crosshair max-h-[80vh] shadow-2xl shadow-amber/5"
        />
        <p className="text-[11px] text-mahogany/30 text-center">
          Klik slot untuk memilih &bull; Geser foto ke slot untuk menempatkan
        </p>
      </div>

      {/* Controls */}
      <div className="w-72 space-y-4">
        {!readOnly && (
          <>
            {/* Photo thumbnails — drag & drop */}
            <div className="bg-cream-card rounded-2xl p-4 border border-amber/5 shadow-sm">
              <div className="text-xs font-bold text-mahogany/50 uppercase tracking-wider mb-3">
                Pilih Foto
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => assignPhoto(photo.id)}
                    onDragStart={() => setDragPhoto(photo.id)}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-amber/10 hover:border-amber shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber/10 group"
                  >
                    <img
                      src={photo.fileUrl}
                      alt={photo.originalName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-fit controls */}
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
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={Number(selectedAlloc.scale)}
                    onChange={(e) => {
                      setAllocations((prev) =>
                        prev.map((a) =>
                          a.slotId === selectedSlot?.id ? { ...a, scale: parseFloat(e.target.value) } : a
                        )
                      );
                    }}
                    className="w-full accent-amber mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Hue ({selectedAlloc.hue}°)
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={Number(selectedAlloc.hue)}
                    onChange={(e) => {
                      setAllocations((prev) =>
                        prev.map((a) =>
                          a.slotId === selectedSlot?.id ? { ...a, hue: parseInt(e.target.value) } : a
                        )
                      );
                    }}
                    className="w-full accent-amber mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Saturation ({selectedAlloc.saturation}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={Number(selectedAlloc.saturation)}
                    onChange={(e) => {
                      setAllocations((prev) =>
                        prev.map((a) =>
                          a.slotId === selectedSlot?.id ? { ...a, saturation: parseInt(e.target.value) } : a
                        )
                      );
                    }}
                    className="w-full accent-amber mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Brightness ({selectedAlloc.brightness}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={Number(selectedAlloc.brightness)}
                    onChange={(e) => {
                      setAllocations((prev) =>
                        prev.map((a) =>
                          a.slotId === selectedSlot?.id ? { ...a, brightness: parseInt(e.target.value) } : a
                        )
                      );
                    }}
                    className="w-full accent-amber mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-mahogany/40">
                    Contrast ({selectedAlloc.contrast}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={Number(selectedAlloc.contrast)}
                    onChange={(e) => {
                      setAllocations((prev) =>
                        prev.map((a) =>
                          a.slotId === selectedSlot?.id ? { ...a, contrast: parseInt(e.target.value) } : a
                        )
                      );
                    }}
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