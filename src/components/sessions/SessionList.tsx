"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Hash, Users, Plus } from "lucide-react";

interface Session {
  id: string;
  slug: string;
  pinCode: string;
  customerName: string;
  status: string;
  basePrice: number;
  extraFrameFee: number;
  createdAt: string;
}

const statusStyle: Record<string, string> = {
  draft: "bg-cacao/10 text-cacao border-cacao/20",
  active: "bg-amber/10 text-amber border-amber/20",
  completed: "bg-mahogany/10 text-mahogany border-mahogany/20",
  expired: "bg-espresso/5 text-mahogany/40 border-mahogany/10",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  completed: "Selesai",
  expired: "Kadaluarsa",
};

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/sessions").then(r => r.json()).then(setSessions);
  }, []);

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <Link
          key={s.id}
          href={`/staff/sessions/${s.id}`}
          className="flex items-center justify-between bg-cream-card rounded-xl p-5 border border-amber/5 shadow-sm hover:shadow-md hover:shadow-amber/5 hover:border-amber/10 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center">
              <Users className="w-5 h-5 text-mahogany/40" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-espresso">{s.customerName}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusStyle[s.status]}`}>
                  {statusLabel[s.status] || s.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-mahogany/40 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {s.slug}
                </span>
                <span className="text-xs text-mahogany/30">PIN {s.pinCode}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-espresso">
              {formatPrice(s.basePrice + s.extraFrameFee)}
            </div>
            <div className="text-xs text-mahogany/30 mt-0.5">
              {new Date(s.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </Link>
      ))}
      {sessions.length === 0 && (
        <div className="text-center py-16 bg-cream-card rounded-2xl border border-amber/5">
          <div className="w-16 h-16 rounded-2xl bg-cream mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-mahogany/15" />
          </div>
          <h3 className="font-display text-xl font-bold text-espresso mb-2">
            Belum Ada Sesi
          </h3>
          <p className="text-mahogany/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Buat sesi foto pertama untuk pelanggan. Mereka akan dapat mengakses dan mengedit foto mereka.
          </p>
          <Link
            href="/staff/sessions/new"
            className="inline-flex items-center gap-2 bg-espresso text-cream px-5 py-3 rounded-xl text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5"
          >
            <Plus className="w-4 h-4" />
            Buat Sesi Baru
          </Link>
        </div>
      )}
    </div>
  );
}
