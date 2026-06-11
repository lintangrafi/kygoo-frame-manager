import Link from "next/link";
import { SessionList } from "@/components/sessions/SessionList";
import { Plus } from "lucide-react";

export default function SessionsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-black italic text-espresso tracking-tight">
            Daftar Sesi
          </h2>
          <p className="mt-1 text-mahogany/40 text-sm">
            Kelola sesi foto pelanggan yang aktif
          </p>
        </div>
        <Link
          href="/staff/sessions/new"
          className="inline-flex items-center gap-2 bg-espresso text-cream px-5 py-3 rounded-xl text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/5 hover:shadow-xl hover:shadow-espresso/10"
        >
          <Plus className="w-4 h-4" />
          Sesi Baru
        </Link>
      </div>
      <SessionList />
    </div>
  );
}
