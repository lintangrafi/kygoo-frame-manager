"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Download, Clock, Hash, Sparkles } from "lucide-react";

interface Session {
  id: string;
  slug: string;
  pinCode: string;
  customerName: string;
  status: string;
  basePrice: number;
}

interface Composition {
  id: string;
  frameId: string;
  status: string;
  previewUrl: string | null;
  exportUrl: string | null;
}

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sessions/${sessionId}`).then(r => r.json()),
      fetch(`/api/sessions/${sessionId}/compositions`).then(r => r.json()),
    ]).then(([s, c]) => {
      setSession(s);
      setCompositions(c);
      setLoading(false);
    });
  }, [sessionId]);

  async function activate() {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setSession(prev => prev ? { ...prev, status: "active" } : null);
  }

  async function approve(compId: string) {
    setApproving(compId);
    await fetch(`/api/compositions/${compId}/approve`, { method: "POST" });
    setCompositions(prev => prev.map(c => c.id === compId ? { ...c, status: "finalized" } : c));
    setApproving(null);
    setJustApproved(compId);
    setTimeout(() => setJustApproved(null), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-cream-card rounded-xl animate-pulse" />
        <div className="h-32 bg-cream-card rounded-xl animate-pulse" />
        <div className="h-32 bg-cream-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div>
      {/* Session header */}
      <div className="flex items-center justify-between mb-8 bg-cream-card rounded-2xl p-6 border border-amber/5 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-display text-3xl font-black italic text-espresso">
              {session.customerName}
            </h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              session.status === "active" ? "bg-amber/10 text-amber" :
              session.status === "completed" ? "bg-mahogany/10 text-mahogany" :
              "bg-cacao/10 text-cacao"
            }`}>
              {session.status === "active" ? "Aktif" :
               session.status === "completed" ? "Selesai" : "Draft"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-mahogany/40">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              <code className="font-bold text-mahogany/60">{session.slug}</code>
            </span>
            <span>PIN: <code className="font-bold text-mahogany/60">{session.pinCode}</code></span>
          </div>
        </div>
        {session.status === "draft" && (
          <button
            onClick={activate}
            className="flex items-center gap-2 bg-amber text-espresso px-5 py-3 rounded-xl text-sm font-bold hover:bg-amber-glow active:scale-[0.97] transition-all duration-200 shadow-lg shadow-amber/10 hover:shadow-xl hover:shadow-amber/20"
          >
            <CheckCircle className="w-4 h-4" />
            Aktifkan Sesi
          </button>
        )}
      </div>

      {/* Compositions */}
      <h3 className="font-display text-2xl font-black italic text-espresso mb-4">Daftar Komposisi</h3>
      <div className="space-y-3">
        {compositions.map(comp => {
          const isJustApproved = justApproved === comp.id;
          const isApproving = approving === comp.id;
          const isFinal = comp.status === "finalized" || isJustApproved;

          return (
            <div
              key={comp.id}
              className={`bg-cream-card rounded-xl p-5 border flex items-center justify-between shadow-sm transition-all duration-500 ${
                isJustApproved
                  ? "border-amber shadow-lg shadow-amber/10 scale-[1.01]"
                  : "border-amber/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                  isJustApproved ? "bg-amber/10" : "bg-cream"
                }`}>
                  {isJustApproved ? (
                    <CheckCircle className="w-5 h-5 text-amber animate-bounce-in" />
                  ) : (
                    <Clock className="w-5 h-5 text-mahogany/30" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-espresso font-mono tracking-tight">
                    {comp.id.slice(0, 12)}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors duration-500 ${
                    isFinal
                      ? "bg-mahogany/10 text-mahogany"
                      : "bg-amber/10 text-amber"
                  }`}>
                    {isJustApproved ? "Disetujui!" : isFinal ? "Final" : "Review"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {comp.exportUrl && (
                  <a
                    href={comp.exportUrl}
                    download
                    className="inline-flex items-center gap-2 bg-cream text-mahogany px-4 py-2 rounded-xl text-xs font-bold border border-amber/10 hover:border-amber/20 hover:bg-warm-paper transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh
                  </a>
                )}
                {comp.status !== "finalized" && !isJustApproved && (
                  <button
                    onClick={() => approve(comp.id)}
                    disabled={isApproving}
                    className="inline-flex items-center gap-2 bg-espresso text-cream px-4 py-2 rounded-xl text-xs font-bold hover:bg-mahogany active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                        Menyetujui
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Setujui
                      </>
                    )}
                  </button>
                )}
                {isJustApproved && (
                  <div className="inline-flex items-center gap-2 bg-amber/10 text-amber px-4 py-2 rounded-xl text-xs font-bold animate-bounce-in">
                    <Sparkles className="w-3.5 h-3.5" />
                    Selesai!
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {compositions.length === 0 && (
          <div className="text-center py-16 bg-cream-card rounded-2xl border border-amber/5">
            <Clock className="w-12 h-12 text-mahogany/10 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-espresso mb-2">
              Masih Kosong
            </h3>
            <p className="text-mahogany/30 text-sm max-w-xs mx-auto leading-relaxed">
              Pelanggan belum memilih frame dan membuat komposisi. Bagikan slug dan PIN ke pelanggan agar mereka mulai.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
