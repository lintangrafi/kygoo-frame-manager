"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Image, Sparkles } from "lucide-react";

export default function NewSessionPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) { setError("Minimal upload 1 foto"); return; }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("customerName", customerName);
    formData.append("basePrice", basePrice);
    files.forEach(f => formData.append("photos", f));

    const res = await fetch("/api/sessions", { method: "POST", body: formData });
    if (!res.ok) {
      setError("Gagal membuat sesi");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/staff/sessions"), 800);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-amber/10 mx-auto mb-6 flex items-center justify-center animate-bounce-in">
          <Sparkles className="w-10 h-10 text-amber" />
        </div>
        <h2 className="font-display text-3xl font-black italic text-espresso mb-3">
          Sesi Berhasil Dibuat!
        </h2>
        <p className="text-mahogany/40 text-sm mb-8">
          Slug dan PIN akan muncul di daftar sesi. Bagikan ke pelanggan Anda.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/staff/sessions")}
            className="bg-espresso text-cream px-6 py-3 rounded-xl text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/10"
          >
            Lihat Daftar Sesi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-black italic text-espresso tracking-tight">
          Buat Sesi Baru
        </h2>
        <p className="mt-1 text-mahogany/40 text-sm">
          Daftarkan pelanggan baru dan upload foto RAW
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl font-medium mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-cream-card rounded-2xl p-8 border border-amber/5 shadow-lg shadow-amber/5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
            Nama Pelanggan
          </label>
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
            placeholder="Contoh: Budi Setiawan"
            className="w-full bg-cream border-2 border-amber/10 rounded-xl px-4 py-3 text-sm text-espresso placeholder:text-mahogany/15 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/5 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
            Harga Dasar (Rp)
          </label>
          <input
            type="number"
            value={basePrice}
            onChange={e => setBasePrice(e.target.value)}
            placeholder="50000"
            className="w-full bg-cream border-2 border-amber/10 rounded-xl px-4 py-3 text-sm text-espresso placeholder:text-mahogany/15 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/5 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
            Foto RAW
          </label>
          <div className="bg-cream border-2 border-dashed border-amber/10 rounded-xl px-6 py-8 text-center hover:border-amber/20 transition-all duration-200">
            <Image className="w-8 h-8 text-mahogany/15 mx-auto mb-3" />
            <p className="text-sm text-mahogany/30 font-medium mb-2">
              Drop atau pilih file
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setFiles(Array.from(e.target.files || []))}
              className="block w-full text-xs text-mahogany/20 file:mx-auto file:py-2 file:px-4 file:rounded-xl file:text-xs file:font-bold file:bg-espresso file:text-cream file:border-0 hover:file:bg-mahogany file:transition-colors file:cursor-pointer"
            />
          </div>
          {files.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber font-semibold">
              <Image className="w-3.5 h-3.5" />
              {files.length} foto dipilih
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-espresso text-cream rounded-xl py-4 text-base font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/10 hover:shadow-xl hover:shadow-espresso/20 active:scale-[0.97] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
              Menyiapkan sesi...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Buat Sesi
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
