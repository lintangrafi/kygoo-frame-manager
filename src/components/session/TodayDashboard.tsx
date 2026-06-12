"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Users, ArrowRight } from "lucide-react";

interface PublicSession {
  id: string;
  slug: string;
  customerName: string;
  status: string;
  createdAt: string;
}

export function TodayDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public-sessions")
      .then(r => r.json())
      .then(data => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin mx-auto mb-4" />
          <p className="text-mahogany/30 text-sm">Memuat sesi hari ini...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber/10 rounded-full px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            <span className="text-xs font-semibold text-amber tracking-widest uppercase">
              Kygoo Frame Studio
            </span>
          </div>
          <h1 className="font-display text-4xl font-black italic text-espresso tracking-tight">
            Pilih Sesi <span className="text-amber">Anda</span>
          </h1>
          <p className="text-mahogany/40 text-sm max-w-xs mx-auto">
            Pilih nama Anda dari daftar di bawah, lalu masukkan PIN yang diberikan oleh staff
          </p>
        </div>

        {/* Session list */}
        {sessions.length === 0 ? (
          <div className="bg-cream-card rounded-2xl border border-amber/5 p-10 text-center shadow-lg shadow-amber/5">
            <Users className="w-12 h-12 text-mahogany/10 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-espresso mb-2">
              Belum Ada Sesi
            </h3>
            <p className="text-mahogany/30 text-sm max-w-xs mx-auto leading-relaxed">
              Belum ada sesi foto aktif hari ini. Silakan tunggu staff membuat sesi Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => router.push(`/s/${session.slug}`)}
                className="film-strip w-full bg-cream-card rounded-2xl p-5 border border-amber/5 shadow-sm hover:shadow-md hover:shadow-amber/5 hover:border-amber/10 transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center group-hover:bg-amber/5 transition-colors">
                      <Users className="w-6 h-6 text-mahogany/30 group-hover:text-amber transition-colors" />
                    </div>
                    <div>
                      <div className="font-bold text-espresso text-lg group-hover:text-amber transition-colors">
                        {session.customerName}
                      </div>
                      <div className="text-xs text-mahogany/30 mt-0.5">
                        Sesi hari ini
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-mahogany/15 group-hover:text-amber group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-mahogany/20">
          &copy; Kygoo Frame Studio &mdash; Setiap foto punya cerita
        </p>
      </div>
    </div>
  );
}
