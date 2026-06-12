"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Download, Grid3X3, Image } from "lucide-react";

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
  additionalFee: number;
  isActive: boolean;
}

interface Composition {
  id: string;
  frameId: string;
  status: string;
  exportUrl: string | null;
}

interface GalleryProps {
  sessionId: string;
  slug: string;
  status: string;
}

export function Gallery({ sessionId, slug, status }: GalleryProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [tab, setTab] = useState<"photos" | "2R" | "4R">("photos");
  const isCompleted = status === "completed";

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/photos`).then(r => r.json()).then(setPhotos);
    fetch("/api/frames").then(r => r.json()).then(setFrames);
    fetch(`/api/sessions/${sessionId}/compositions`).then(r => r.json()).then(setCompositions);
  }, [sessionId]);

  async function handleSelectFrame(frameId: string) {
    const res = await fetch(`/api/sessions/${sessionId}/compositions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameId }),
    });
    if (!res.ok) {
      alert("Gagal memilih frame. Silakan coba lagi.");
      return;
    }
    const comp = await res.json();
    router.push(`/s/${slug}/editor/${comp.id}`);
  }

  const frameList = frames.filter(f => f.category === tab);
  const completedComps = compositions.filter(c => c.status === "finalized");

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {frameList.filter(f => f.isActive).map(f => (
            <div
              key={f.id}
              className="film-strip group bg-cream-card rounded-2xl overflow-hidden border border-amber/5 shadow-lg shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[2/3] bg-cream relative overflow-hidden">
                <img
                  src={f.fileUrl}
                  alt={f.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-5 py-4 space-y-3 border-t border-amber/5">
                <div>
                  <div className="font-bold text-espresso text-sm">{f.name}</div>
                  {f.additionalFee > 0 && (
                    <div className="text-amber font-semibold text-xs mt-0.5">
                      +Rp {f.additionalFee.toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => handleSelectFrame(f.id)}
                    className="w-full bg-espresso text-cream rounded-xl py-3 text-sm font-bold hover:bg-mahogany transition-all duration-200 hover:shadow-lg hover:shadow-espresso/10 active:scale-[0.98]"
                  >
                    Pilih Frame
                  </button>
                )}
              </div>
            </div>
          ))}
          {frameList.filter(f => f.isActive).length === 0 && (
            <div className="col-span-full text-center py-20 text-mahogany/30">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Belum ada frame</p>
            </div>
          )}
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
