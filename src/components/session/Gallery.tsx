"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Download, Grid3X3, Image, Clock, Zap, DollarSign } from "lucide-react";
import { PriceCalculator, PriceBadge } from "@/components/pricing/PriceCalculator";

interface Photo {
  id: string;
  fileUrl: string;
  originalName: string;
}

interface Frame {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  thumbnailUrl?: string;
  additionalFee: number;
  isActive: boolean;
  occasion?: string;
  description?: string;
}

interface Composition {
  id: string;
  frameId: string;
  status: string;
  previewUrl: string | null;
  exportUrl: string | null;
  frame?: Frame;
}

interface SessionPricing {
  basePrice: number;
  extraFrameFee: number;
}

interface GalleryProps {
  sessionId: string;
  slug: string;
  status: string;
  pricing?: SessionPricing;
}

export function Gallery({ sessionId, slug, status, pricing = { basePrice: 0, extraFrameFee: 0 } }: GalleryProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [tab, setTab] = useState<"photos" | "2R" | "4R">("photos");
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const isCompleted = status === "completed";

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/photos`).then(r => r.json()).then(setPhotos);
    fetch("/api/frames").then(r => r.json()).then(setFrames);
    fetch(`/api/sessions/${sessionId}/compositions`).then(r => r.json()).then(setCompositions);
  }, [sessionId]);

  async function handleSelectFrame(frameId: string) {
    // Find the frame info for pricing
    const frame = frames.find(f => f.id === frameId);
    setSelectedFrame(frame || null);

    const res = await fetch(`/api/sessions/${sessionId}/compositions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameId, autoFill: autoFillEnabled }),
    });
    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Gagal memilih frame. Silakan coba lagi.");
      return;
    }
    const comp = await res.json();
    router.push(`/s/${slug}/editor/${comp.id}`);
  }

  const frameList = frames.filter(f => f.category === tab);
  const completedComps = compositions.filter(c => c.status === "finalized");

  // Calculate pricing
  const compositionCount = compositions.filter(c => c.status === "finalized").length + 1;
  const frameFee = selectedFrame?.additionalFee || 0;
  const estimatedTotal = pricing.basePrice + (pricing.extraFrameFee || 0) + (frameFee * compositionCount);

  const tabs = [
    { id: "photos" as const, label: "Foto Saya", icon: Grid3X3 },
    { id: "2R" as const, label: "Frame 2R", icon: Image },
    { id: "4R" as const, label: "Frame 4R", icon: Image },
  ];

  return (
    <div className="min-h-screen bg-cream p-6 lg:p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-amber/10 rounded-full px-4 py-1.5 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber" />
          <span className="text-xs font-semibold text-amber tracking-widest uppercase">
            {isCompleted ? "Sesi Selesai" : "Pilih & Edit"}
          </span>
        </div>
        <h1 className="font-display text-5xl font-black italic text-espresso tracking-tight">
          Foto & Frame <span className="text-amber">Anda</span>
        </h1>
        <hr className="golden-divider mt-4 w-32 ml-0" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-espresso text-cream shadow-lg shadow-espresso/10"
                  : "bg-cream-card text-mahogany/50 hover:text-espresso hover:bg-cream-card/80 border border-amber/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Photos Grid */}
      {tab === "photos" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(p => (
            <div
              key={p.id}
              className="film-strip group bg-cream-card rounded-2xl overflow-hidden border border-amber/5 shadow-lg shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={p.fileUrl}
                  alt={p.originalName}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div className="col-span-full text-center py-20 text-mahogany/30">
              <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Belum ada foto</p>
            </div>
          )}
        </div>
      )}

      {/* Frames Grid */}
      {tab !== "photos" && (
        <>
          {/* Auto-fill toggle */}
          <div className="flex items-center justify-between mb-6 bg-cream-card rounded-xl px-4 py-3 border border-amber/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber" />
              <span className="text-sm font-semibold text-espresso">Auto-fill Foto</span>
            </div>
            <button
              onClick={() => setAutoFillEnabled(!autoFillEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoFillEnabled ? "bg-amber" : "bg-mahogany/20"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  autoFillEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Price Estimator */}
          {selectedFrame && (
            <div className="mb-6">
              <PriceCalculator
                basePrice={pricing.basePrice}
                extraFrameFee={pricing.extraFrameFee}
                frameName={selectedFrame.name}
                frameCategory={selectedFrame.category}
                frameFee={selectedFrame.additionalFee}
                compositionCount={compositionCount}
              />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {frameList.filter(f => f.isActive).map(f => (
              <div
                key={f.id}
                className={`film-strip group bg-cream-card rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 ${
                  selectedFrame?.id === f.id ? "border-amber shadow-xl shadow-amber/20" : "border-amber/5 hover:shadow-xl hover:shadow-amber/10"
                }`}
              >
                <div className="aspect-[2/3] bg-cream relative overflow-hidden">
                  <img
                    src={f.fileUrl}
                    alt={f.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Price badge */}
                  {f.additionalFee > 0 && (
                    <div className="absolute top-3 right-3">
                      <PriceBadge fee={f.additionalFee} size="sm" />
                    </div>
                  )}
                  {/* Selected indicator */}
                  {selectedFrame?.id === f.id && (
                    <div className="absolute inset-0 bg-amber/10 flex items-center justify-center">
                      <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-espresso" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 space-y-3 border-t border-amber/5">
                  <div>
                    <div className="font-bold text-espresso text-sm">{f.name}</div>
                    {f.description && (
                      <div className="text-[10px] text-mahogany/40 mt-1 line-clamp-2">
                        {f.description}
                      </div>
                    )}
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => handleSelectFrame(f.id)}
                      className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedFrame?.id === f.id
                          ? "bg-amber text-espresso hover:bg-amber-glow"
                          : "bg-espresso text-cream hover:bg-mahogany"
                      }`}
                    >
                      {autoFillEnabled ? (
                        <>
                          <Zap className="w-4 h-4" />
                          Pilih + Auto-fill
                        </>
                      ) : (
                        "Pilih Frame"
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {frameList.filter(f => f.isActive).length === 0 && (
            <div className="col-span-full text-center py-20 text-mahogany/30">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Belum ada frame</p>
            </div>
          )}
        </>
      )}

      {/* Compositions in Review/Approved */}
      {compositions.filter(c => c.status === "review" || c.status === "approved").length > 0 && (
        <div className="mt-14">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-black italic text-espresso">
              Menunggu Persetujuan
            </h2>
            <hr className="golden-divider mt-3 w-24 ml-0" />
            <p className="text-mahogany/40 text-sm mt-2">
              Frame Anda sedang ditinjau oleh staff
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {compositions.filter(c => c.status === "review" || c.status === "approved").map(comp => (
              <div
                key={comp.id}
                className="film-strip bg-cream-card rounded-2xl overflow-hidden border border-amber/10 shadow-lg shadow-amber/5 transition-all duration-300"
              >
                <div className="aspect-[2/3] bg-cream relative overflow-hidden">
                  {comp.previewUrl || comp.exportUrl ? (
                    <img
                      src={comp.previewUrl || comp.exportUrl || ""}
                      alt="Preview"
                      className="w-full h-full object-contain p-4 opacity-80"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-mahogany/20">
                      <Clock className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 border-t border-amber/5 text-center">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                    comp.status === "approved"
                      ? "bg-green-50 text-green-600"
                      : "bg-amber/10 text-amber"
                  }`}>
                    {comp.status === "approved" ? "✓ Disetujui" : "⏳ Menunggu"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finalized Results */}
      {completedComps.length > 0 && (
        <div className="mt-14">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-black italic text-espresso">
              Hasil Final
            </h2>
            <hr className="golden-divider mt-3 w-24 ml-0" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedComps.map(comp => (
              <div
                key={comp.id}
                className="film-strip bg-cream-card rounded-2xl overflow-hidden border border-amber/10 shadow-lg shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-all duration-300"
              >
                <div className="aspect-[2/3] bg-cream relative overflow-hidden">
                  <img
                    src={comp.exportUrl || ""}
                    alt="Result"
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <div className="px-5 py-4 border-t border-amber/5">
                  <a
                    href={comp.exportUrl || "#"}
                    download
                    className="flex items-center justify-center gap-2 w-full bg-amber text-espresso rounded-xl py-3 text-sm font-bold hover:bg-amber-glow transition-all duration-200 shadow-lg shadow-amber/10 hover:shadow-xl hover:shadow-amber/20 hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
