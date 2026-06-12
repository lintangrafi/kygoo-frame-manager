"use client";

import { useState, useRef } from "react";
import { burstConfetti } from "@/lib/confetti";

interface PinGateProps {
  slug: string;
  onSuccess: (info: {
    sessionId: string;
    customerName: string;
    status: string;
    photoCount: number;
  }) => void;
}

export function PinGate({ slug, onSuccess }: PinGateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, pin }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
      return;
    }

    const data = await res.json();

    // Ambil jumlah foto
    const photoRes = await fetch(`/api/sessions?slug=${slug}`);
    const sessions = await photoRes.json();
    let photoCount = 0;
    if (Array.isArray(sessions) && sessions.length > 0) {
      const sessionId = sessions[0].id;
      const photosRes = await fetch(`/api/sessions/${sessionId}/photos`);
      const photos = await photosRes.json();
      photoCount = Array.isArray(photos) ? photos.length : 0;
    }

    if (cardRef.current) burstConfetti(cardRef.current);

    setTimeout(() => {
      onSuccess({
        sessionId: data.sessionId || sessions[0]?.id,
        customerName: data.customerName,
        status: data.status || "active",
        photoCount,
      });
    }, 400);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="flex gap-3 mb-10 opacity-40">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-16 h-16 rounded-md border-2 border-amber/40 bg-cream-card shadow-sm transition-transform duration-300 hover:scale-110 hover:opacity-80"
            style={{ transform: `rotate(${(i - 2) * 3}deg)` }}
          />
        ))}
      </div>

      <div
        ref={cardRef}
        className="film-strip bg-cream-card border border-amber/20 rounded-2xl p-10 w-full max-w-md shadow-2xl shadow-amber/10 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber/5 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber/10 rounded-full px-4 py-1.5 mb-2">
            <span className="w-2 h-2 bg-amber rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-amber tracking-widest uppercase">
              Studio Frame
            </span>
          </div>

          <div>
            <h1 className="font-display text-4xl font-black italic text-espresso tracking-tight leading-tight">
              Kygoo<br />
              <span className="text-amber">Frame Studio</span>
            </h1>

            <hr className="golden-divider my-5 w-32 mx-auto" />

            <p className="text-mahogany/60 text-sm leading-relaxed max-w-xs mx-auto">
              Masukkan PIN Anda untuk mengakses dan mengedit foto
            </p>
          </div>

          <div className="bg-cream rounded-xl px-4 py-3 text-xs">
            <span className="font-semibold text-mahogany/70">Sesi: </span>
            <code className="bg-warm-paper px-2 py-0.5 rounded text-amber font-bold tracking-wider">
              {slug}
            </code>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4-digit PIN"
                className="w-full text-center text-3xl font-bold tracking-[0.5em] py-5 rounded-xl bg-cream border-2 border-amber/20 text-espresso placeholder:text-mahogany/20 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/10 transition-all duration-200"
              />
              <div className="flex gap-2 mt-3 justify-center">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                      pin[i]
                        ? "bg-amber border-amber scale-110 animate-bounce-in"
                        : "border-amber/20 bg-transparent"
                    }`}
                    style={{ animationDelay: pin[i] ? `${i * 0.05}s` : "0s" }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={pin.length !== 4 || loading}
              className="w-full bg-espresso text-cream rounded-xl py-4 text-base font-bold hover:bg-mahogany transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-espresso/10 hover:shadow-xl hover:shadow-espresso/20 active:scale-[0.97] hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                  Membuka galeri Anda...
                </span>
              ) : (
                "Lihat Foto Saya"
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-xs text-mahogany/30">
        &copy; Kygoo Frame Studio &mdash; Setiap foto punya cerita
      </p>
    </div>
  );
}
