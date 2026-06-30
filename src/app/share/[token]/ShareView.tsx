"use client";

import { useState } from "react";
import { Copy, Check, Download, Image, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ShareViewProps {
  composition: any;
  session: any;
  frame: any;
}

export function ShareView({ composition, session, frame }: ShareViewProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  const shareWhatsApp = () => {
    const text = `Hai! Lihat hasil foto saya di Kygoo Frame Studio: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-cream p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-black italic text-espresso mb-2">
            Hasil Foto
          </h1>
          <p className="text-mahogany/50"> dari {session.customerName}</p>
        </div>

        {/* Preview Image */}
        <div className="bg-cream-card rounded-2xl p-6 border border-amber/10 shadow-lg mb-6">
          {composition.exportUrl || composition.previewUrl ? (
            <img
              src={composition.exportUrl || composition.previewUrl || ""}
              alt="Preview"
              className="w-full h-auto rounded-xl"
            />
          ) : (
            <div className="aspect-[2/3] bg-warm-paper rounded-xl flex items-center justify-center">
              <Image className="w-16 h-16 text-mahogany/20" />
              <p className="text-mahogany/30 ml-2">Preview belum tersedia</p>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="text-center mb-6">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            composition.status === "finalized"
              ? "bg-green-100 text-green-700"
              : composition.status === "approved"
              ? "bg-blue-100 text-blue-700"
              : "bg-amber/10 text-amber"
          }`}>
            {composition.status === "finalized" && "✓ Final"}
            {composition.status === "approved" && "✓ Disetujui"}
            {composition.status === "review" && "⏳ Menunggu Persetujuan"}
            {composition.status === "draft" && "📝 Draft"}
          </span>
        </div>

        {/* Frame Info */}
        {frame && (
          <div className="bg-cream-card rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-espresso mb-2">Frame: {frame.name}</h3>
            <p className="text-sm text-mahogany/50">
              Kategori: {frame.category} • Ukuran: {frame.dimensionsW}×{frame.dimensionsH}px
            </p>
          </div>
        )}

        {/* Share Actions */}
        <div className="bg-cream-card rounded-2xl p-6 border border-amber/10">
          <h3 className="font-semibold text-espresso mb-4">Bagikan Hasil</h3>

          <div className="space-y-3">
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 bg-espresso text-cream rounded-xl py-3 font-semibold hover:bg-mahogany transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Link Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Salin Link
                </>
              )}
            </button>

            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-semibold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Kirim via WhatsApp
            </button>

            {composition.exportUrl && (
              <a
                href={composition.exportUrl}
                download
                className="w-full flex items-center justify-center gap-2 bg-amber text-espresso rounded-xl py-3 font-semibold hover:bg-amber-glow transition-colors"
              >
                <Download className="w-5 h-5" />
                Download PNG
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-mahogany/30 text-sm mt-8">
          &copy; Kygoo Frame Studio
        </p>
      </div>
    </div>
  );
}
