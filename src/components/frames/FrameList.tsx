"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface Frame {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  additionalFee: number;
  isActive: boolean;
}

const categoryStyle: Record<string, string> = {
  "2R": "bg-amber/10 text-amber",
  "4R": "bg-mahogany/10 text-mahogany",
};

export function FrameList() {
  const [frames, setFrames] = useState<Frame[]>([]);

  const fetchFrames = () => fetch("/api/frames").then(r => r.json()).then(setFrames);
  useEffect(() => { fetchFrames(); }, []);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/frames/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchFrames();
  }

  async function deleteFrame(id: string) {
    if (!confirm("Hapus frame ini? Tindakan ini tidak bisa dibatalkan.")) return;
    await fetch(`/api/frames/${id}`, { method: "DELETE" });
    fetchFrames();
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
      {frames.map(f => (
        <div
          key={f.id}
          className="film-strip group bg-cream-card rounded-2xl overflow-hidden border border-amber/5 shadow-md shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="aspect-[2/3] bg-cream relative overflow-hidden">
            <img
              src={f.fileUrl}
              alt={f.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="px-5 py-4 space-y-3 border-t border-amber/5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-espresso text-sm">{f.name}</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${categoryStyle[f.category] || "bg-cacao/10 text-cacao"}`}>
                {f.category}
              </span>
            </div>
            {f.additionalFee > 0 && (
              <div className="text-amber font-semibold text-xs">
                {formatPrice(f.additionalFee)}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(f.id, f.isActive)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  f.isActive
                    ? "bg-mahogany/10 text-mahogany border border-mahogany/10"
                    : "bg-cream text-mahogany/30 border border-amber/10"
                }`}
              >
                {f.isActive ? "Aktif" : "Nonaktif"}
              </button>
              <Link
                href={`/staff/frames/${f.id}`}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-cream text-mahogany/50 border border-amber/10 hover:border-amber/20 hover:text-mahogany transition-all duration-200"
              >
                Edit
              </Link>
              <button
                onClick={() => deleteFrame(f.id)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
      {frames.length === 0 && (
        <div className="col-span-full text-center py-16 bg-cream-card rounded-2xl border border-amber/5">
          <div className="w-16 h-16 rounded-2xl bg-cream mx-auto mb-4 flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-mahogany/15" />
          </div>
          <h3 className="font-display text-xl font-bold text-espresso mb-2">
            Belum Ada Frame
          </h3>
          <p className="text-mahogany/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Upload frame pertama untuk mulai. Pelanggan akan bisa memilih frame untuk foto mereka.
          </p>
          <Link
            href="/staff/frames/new"
            className="inline-flex items-center gap-2 bg-espresso text-cream px-5 py-3 rounded-xl text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5"
          >
            + Upload Frame
          </Link>
        </div>
      )}
    </div>
  );
}
