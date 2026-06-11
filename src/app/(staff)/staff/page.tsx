export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-4xl font-black italic text-espresso tracking-tight">
          Dashboard
        </h2>
        <hr className="golden-divider mt-3 w-24 ml-0" />
        <p className="mt-3 text-mahogany/50 text-sm">Ringkasan aktivitas studio hari ini</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="film-strip bg-cream-card rounded-2xl p-6 border border-amber/10 shadow-lg shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-shadow duration-300">
          <div className="text-xs font-bold text-amber uppercase tracking-widest mb-3">
            Sesi Aktif
          </div>
          <div className="font-display text-5xl font-black text-espresso tracking-tight">
            0
          </div>
          <div className="mt-2 text-xs text-mahogany/40 font-medium">
            Dalam proses
          </div>
        </div>

        <div className="film-strip bg-cream-card rounded-2xl p-6 border border-amber/10 shadow-lg shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-shadow duration-300">
          <div className="text-xs font-bold text-amber uppercase tracking-widest mb-3">
            Pending Review
          </div>
          <div className="font-display text-5xl font-black text-espresso tracking-tight">
            0
          </div>
          <div className="mt-2 text-xs text-mahogany/40 font-medium">
            Perlu finalisasi
          </div>
        </div>

        <div className="film-strip bg-cream-card rounded-2xl p-6 border border-amber/10 shadow-lg shadow-amber/5 hover:shadow-xl hover:shadow-amber/10 transition-shadow duration-300">
          <div className="text-xs font-bold text-amber uppercase tracking-widest mb-3">
            Akan Kadaluarsa
          </div>
          <div className="font-display text-5xl font-black text-espresso tracking-tight">
            0
          </div>
          <div className="mt-2 text-xs text-mahogany/40 font-medium">
            Dalam 3 hari
          </div>
        </div>
      </div>

      {/* Welcome message */}
      <div className="mt-8 bg-cream-card rounded-2xl p-8 border border-amber/10 shadow-lg shadow-amber/5">
        <h3 className="font-display text-2xl font-black italic text-espresso">
          Selamat Datang di Kygoo Frame Studio
        </h3>
        <p className="mt-2 text-mahogany/50 max-w-md text-sm leading-relaxed">
          Kelola sesi foto, upload frame baru, dan review hasil edit — semua dari satu tempat.
        </p>
      </div>
    </div>
  );
}
