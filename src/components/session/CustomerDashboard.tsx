"use client";

import { Camera, Image, Sparkles } from "lucide-react";

interface CustomerDashboardProps {
  customerName: string;
  sessionId: string;
  slug: string;
  status: string;
  photoCount: number;
  onEnter: () => void;
}

export function CustomerDashboard({ customerName, sessionId, slug, status, photoCount, onEnter }: CustomerDashboardProps) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      {/* Decorative film strip top */}
      <div className="flex gap-3 mb-10 opacity-40">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-16 h-16 rounded-md border-2 border-amber/40 bg-cream-card shadow-sm"
            style={{ transform: `rotate(${(i - 2) * 3}deg)` }}
          />
        ))}
      </div>

      {/* Dashboard Card */}
      <div className="film-strip bg-cream-card border border-amber/20 rounded-2xl p-10 w-full max-w-lg shadow-2xl shadow-amber/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber/5 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-8 text-center">
          {/* Welcome */}
          <div>
            <div className="inline-flex items-center gap-2 bg-amber/10 rounded-full px-4 py-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber" />
              <span className="text-xs font-semibold text-amber tracking-widest uppercase">
                Selamat Datang
              </span>
            </div>
            <h1 className="font-display text-4xl font-black italic text-espresso tracking-tight">
              Halo,{" "}
              <span className="text-amber">{customerName}</span>!
            </h1>
            <hr className="golden-divider my-5 w-32 mx-auto" />
            <p className="text-mahogany/50 text-sm leading-relaxed max-w-sm mx-auto">
              Foto Anda sudah siap. Pilih frame favorit dan atur posisi foto sesuai selera Anda.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream rounded-2xl p-5 border border-amber/5">
              <Camera className="w-6 h-6 text-amber mb-2 mx-auto" />
              <div className="font-display text-3xl font-black text-espresso">
                {photoCount}
              </div>
              <div className="text-xs text-mahogany/40 font-medium mt-1">
                Foto
              </div>
            </div>
            <div className="bg-cream rounded-2xl p-5 border border-amber/5">
              <Image className="w-6 h-6 text-amber mb-2 mx-auto" />
              <div className="font-display text-3xl font-black text-espresso">
                {status === "completed" ? "✓" : status === "active" ? "3" : "0"}
              </div>
              <div className="text-xs text-mahogany/40 font-medium mt-1">
                Frame Tersedia
              </div>
            </div>
          </div>

          {/* Session info */}
          <div className="bg-cream rounded-xl px-4 py-3 text-xs">
            <span className="font-semibold text-mahogany/50">Sesi Anda: </span>
            <code className="bg-warm-paper px-2 py-0.5 rounded text-amber font-bold tracking-wider">
              {slug}
            </code>
          </div>

          {/* CTA */}
          <button
            onClick={onEnter}
            className="w-full bg-espresso text-cream rounded-xl py-4 text-base font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/10 hover:shadow-xl hover:shadow-espresso/20 active:scale-[0.97] hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Mulai Pilih Frame
            </span>
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs text-mahogany/30">
        &copy; Kygoo Frame Studio &mdash; Setiap foto punya cerita
      </p>
    </div>
  );
}
