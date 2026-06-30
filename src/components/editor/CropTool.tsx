"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";

interface CropToolProps {
  imageUrl: string;
  slotWidth: number;
  slotHeight: number;
  initialCrop?: { x: number; y: number; width: number; height: number } | null;
  onApply: (crop: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

export function CropTool({
  imageUrl,
  slotWidth,
  slotHeight,
  initialCrop,
  onApply,
  onCancel,
}: CropToolProps) {
  const [crop, setCrop] = useState({
    x: initialCrop?.x ?? 0,
    y: initialCrop?.y ?? 0,
    width: initialCrop?.width ?? slotWidth,
    height: initialCrop?.height ?? slotHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  // Scale for display
  const scale = Math.min(1, 400 / Math.max(slotWidth, slotHeight));
  const displayW = slotWidth * scale;
  const displayH = slotHeight * scale;

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle || "move");
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height,
    });
  }, [crop]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;

    if (dragHandle === "move") {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(slotWidth - prev.width, dragStart.cropX + dx)),
        y: Math.max(0, Math.min(slotHeight - prev.height, dragStart.cropY + dy)),
      }));
    } else if (dragHandle === "nw") {
      setCrop(prev => ({
        x: Math.max(0, Math.min(dragStart.cropX + dx, dragStart.cropW - 20)),
        y: Math.max(0, Math.min(dragStart.cropY + dy, dragStart.cropH - 20)),
        width: Math.max(20, dragStart.cropW - dx),
        height: Math.max(20, dragStart.cropH - dy),
      }));
    } else if (dragHandle === "ne") {
      setCrop(prev => ({
        ...prev,
        y: Math.max(0, Math.min(dragStart.cropY + dy, dragStart.cropH - 20)),
        width: Math.max(20, dragStart.cropW + dx),
        height: Math.max(20, dragStart.cropH - dy),
      }));
    } else if (dragHandle === "sw") {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(dragStart.cropX + dx, dragStart.cropW - 20)),
        width: Math.max(20, dragStart.cropW - dx),
        height: Math.max(20, dragStart.cropH + dy),
      }));
    } else if (dragHandle === "se") {
      setCrop(prev => ({
        ...prev,
        width: Math.max(20, dragStart.cropW + dx),
        height: Math.max(20, dragStart.cropH + dy),
      }));
    } else if (dragHandle === "n") {
      setCrop(prev => ({
        ...prev,
        y: Math.max(0, Math.min(dragStart.cropY + dy, dragStart.cropH - 20)),
        height: Math.max(20, dragStart.cropH - dy),
      }));
    } else if (dragHandle === "s") {
      setCrop(prev => ({
        ...prev,
        height: Math.max(20, dragStart.cropH + dy),
      }));
    } else if (dragHandle === "w") {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(dragStart.cropX + dx, dragStart.cropW - 20)),
        width: Math.max(20, dragStart.cropW - dx),
      }));
    } else if (dragHandle === "e") {
      setCrop(prev => ({
        ...prev,
        width: Math.max(20, dragStart.cropW + dx),
      }));
    }
  }, [isDragging, dragStart, dragHandle, scale, slotWidth, slotHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0, width: slotWidth, height: slotHeight });
  };

  const applyCrop = () => {
    // Convert to percentage-based crop for API
    onApply({
      x: (crop.x / slotWidth) * 100,
      y: (crop.y / slotHeight) * 100,
      width: (crop.width / slotWidth) * 100,
      height: (crop.height / slotHeight) * 100,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
      <div className="bg-espresso rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 bg-mahogany/50 border-b border-amber/10 flex items-center justify-between">
          <h3 className="text-cream font-bold">Crop Foto</h3>
          <button onClick={onCancel} className="text-cream/50 hover:text-cream">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Canvas */}
        <div className="p-6 flex justify-center">
          <div
            className="relative bg-black overflow-hidden"
            style={{ width: displayW, height: displayH }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Image */}
            <img
              src={imageUrl}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: `translate(${-crop.x * scale}px, ${-crop.y * scale}px)` }}
              draggable={false}
            />

            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              style={{
                clipPath: `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%,
                  0% 0%, ${crop.x * scale}px ${crop.y * scale}px,
                  ${(crop.x + crop.width) * scale}px ${crop.y * scale}px,
                  ${(crop.x + crop.width) * scale}px ${(crop.y + crop.height) * scale}px,
                  ${crop.x * scale}px ${(crop.y + crop.height) * scale}px,
                  0% ${crop.height * scale}px, 0% 100%
                )`,
              }}
            />

            {/* Crop Border */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: crop.x * scale,
                top: crop.y * scale,
                width: crop.width * scale,
                height: crop.height * scale,
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>

              {/* Handles */}
              {[
                { pos: "nw", cursor: "nw-resize", style: { top: -4, left: -4 } },
                { pos: "ne", cursor: "ne-resize", style: { top: -4, right: -4 } },
                { pos: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
                { pos: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
                { pos: "n", cursor: "n-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
                { pos: "s", cursor: "s-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
                { pos: "w", cursor: "w-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
                { pos: "e", cursor: "e-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
              ].map(({ pos, cursor, style }) => (
                <div
                  key={pos}
                  className="absolute w-3 h-3 bg-white rounded-sm cursor-crosshair"
                  style={{ cursor, ...style } as React.CSSProperties}
                  onMouseDown={(e) => handleMouseDown(e, pos)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 text-center text-cream/50 text-xs">
          Ukuran: {Math.round(crop.width)} × {Math.round(crop.height)} px
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-mahogany/50 border-t border-amber/10 flex gap-3 justify-end">
          <button
            onClick={resetCrop}
            className="px-4 py-2 text-sm text-cream/70 hover:text-cream transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-cream/70 hover:text-cream transition-colors"
          >
            Batal
          </button>
          <button
            onClick={applyCrop}
            className="px-4 py-2 text-sm bg-amber text-espresso rounded-lg font-semibold hover:bg-amber-glow transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Terapkan Crop
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple crop indicator overlay for the editor
interface CropOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cropData: { x: number; y: number; width: number; height: number } | null;
  scale: number;
  slotX: number;
  slotY: number;
  slotW: number;
  slotH: number;
}

export function CropOverlay({ canvasRef, cropData, scale, slotX, slotY, slotW, slotH }: CropOverlayProps) {
  if (!cropData) return null;

  const canvas = canvasRef.current;
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const displayX = slotX + (slotW * cropData.x / 100);
  const displayY = slotY + (slotH * cropData.y / 100);
  const displayW = slotW * cropData.width / 100;
  const displayH = slotH * cropData.height / 100;

  // Draw crop overlay (darkened area outside crop)
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  // Top
  ctx.fillRect(displayX - 100, displayY - 100, displayW + 200, 100);
  // Bottom
  ctx.fillRect(displayX - 100, displayY + displayH, displayW + 200, 100);
  // Left
  ctx.fillRect(displayX - 100, displayY, 100, displayH);
  // Right
  ctx.fillRect(displayX + displayW, displayY, 100, displayH);

  // Draw crop border
  ctx.strokeStyle = "#D4872B";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(displayX, displayY, displayW, displayH);
  ctx.setLineDash([]);

  return null;
}
