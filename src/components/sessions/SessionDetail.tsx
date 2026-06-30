"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, Download, Clock, Hash, Sparkles, Upload, Image, Trash2, Eye } from "lucide-react";

interface Session {
  id: string;
  slug: string;
  pinCode: string;
  customerName: string;
  status: string;
  basePrice: number;
}

interface Photo {
  id: string;
  fileUrl: string;
  originalName: string;
  fileExists: boolean;
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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    Promise.all([
      fetch(`/api/sessions/${sessionId}`).then(r => r.json()),
      fetch(`/api/sessions/${sessionId}/compositions`).then(r => r.json()),
      fetch(`/api/sessions/${sessionId}/photos`).then(r => r.json()),
    ]).then(([s, c, p]) => {
      setSession(s && !s.error ? s : null);
      setCompositions(Array.isArray(c) ? c : []);
      setPhotos(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => {
      setSession(null);
      setCompositions([]);
      setPhotos([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  async function handleUploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const uploadPromises = Array.from(files).map((file, idx) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch(`/api/sessions/${sessionId}/photos`, {
        method: "POST",
        body: formData,
      }).then(() => {
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
      });
    });

    await Promise.all(uploadPromises);

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchData();
  }

  async function activate() {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setSession(prev => prev ? { ...prev, status: "active" } : null);
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Hapus foto ini? Tindakan ini tidak bisa dibatalkan.")) return;

    setDeletingPhoto(photoId);
    await fetch(`/api/sessions/${sessionId}/photos?photoId=${photoId}`, {
      method: "DELETE",
    });
    setDeletingPhoto(null);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

  async function approve(compId: string) {
    setApproving(compId);
    await fetch(`/api/compositions/${compId}/approve`, { method: "POST" });
    setCompositions(prev => prev.map(c => c.id === compId ? { ...c, status: "approved" } : c));
    setApproving(null);
    setJustApproved(compId);
    setTimeout(() => setJustApproved(null), 2000);
  }

  async function finalize(compId: string) {
    setApproving(compId);
    await fetch(`/api/compositions/${compId}/finalize`, { method: "POST" });
    setCompositions(prev => prev.map(c => c.id === compId ? { ...c, status: "finalized" } : c));
    setApproving(null);
    setJustApproved(compId);
    setTimeout(() => setJustApproved(null), 2000);
  }

  // Handle approve button - calls the approve endpoint (review -> approved)
  async function handleApprove(compId: string) {
    await approve(compId);
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-cream-card rounded-2xl p-6 border border-amber/5 shadow-sm">
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
        <div className="flex gap-2">
          {/* Upload foto */}
          <div className="relative">
            <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ${
              uploading
                ? "bg-cream text-mahogany/30 pointer-events-none"
                : "bg-cream border border-amber/10 text-mahogany hover:border-amber/20 hover:bg-warm-paper"
            }`}>
              {uploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
                  Upload {uploadProgress.current}/{uploadProgress.total}
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload Foto
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadPhotos}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {/* Progress bar */}
            {uploading && uploadProgress.total > 0 && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            )}
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
      </div>

      {/* Compositions */}
      <h3 className="font-display text-2xl font-black italic text-espresso mb-4">Daftar Komposisi</h3>
      <div className="space-y-3">
        {compositions.map(comp => {
          const isJustApproved = justApproved === comp.id;
          const isApproving = approving === comp.id;

          const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
            draft: { label: "Draft", color: "text-cacao", bg: "bg-cacao/10" },
            review: { label: "Menunggu Review", color: "text-amber", bg: "bg-amber/10" },
            approved: { label: "Disetujui", color: "text-green-600", bg: "bg-green-50" },
            finalized: { label: "Final", color: "text-mahogany", bg: "bg-mahogany/10" },
          };
          const status = statusConfig[comp.status] || statusConfig.draft;

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
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors duration-500 ${status.bg} ${status.color}`}>
                    {isJustApproved ? "Disetujui!" : status.label}
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
                {/* Show Finalize button for approved compositions */}
                {comp.status === "approved" && (
                  <button
                    onClick={() => finalize(comp.id)}
                    disabled={isApproving}
                    className="inline-flex items-center gap-2 bg-espresso text-cream px-4 py-2 rounded-xl text-xs font-bold hover:bg-mahogany active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                        Memfinalisasi
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Finalisasi
                      </>
                    )}
                  </button>
                )}
                {/* Show Approve button for review compositions */}
                {comp.status === "review" && (
                  <button
                    onClick={() => handleApprove(comp.id)}
                    disabled={isApproving}
                    className="inline-flex items-center gap-2 bg-amber text-espresso px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-glow active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-espresso/40 border-t-espresso rounded-full animate-spin" />
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
            <Image className="w-12 h-12 text-mahogany/10 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-espresso mb-2">
              Masih Kosong
            </h3>
            <p className="text-mahogany/30 text-sm max-w-xs mx-auto leading-relaxed">
              Pelanggan belum memilih frame dan membuat komposisi. Upload foto di atas dan bagikan slug dan PIN ke pelanggan.
            </p>
          </div>
        )}
      </div>

      {/* Photos Section */}
      <h3 className="font-display text-2xl font-black italic text-espresso mb-4 mt-8">Foto Pelanggan</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {photos.map(photo => (
          <div
            key={photo.id}
            className="relative group film-strip bg-cream-card rounded-xl overflow-hidden border border-amber/5 shadow-sm hover:shadow-md hover:shadow-amber/5 transition-all duration-200"
          >
            <div className="aspect-square relative">
              {photo.fileExists ? (
                <img
                  src={photo.fileUrl || ""}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-300">
                  <span className="text-xs">File hilang</span>
                </div>
              )}
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setPreviewPhoto(photo)}
                  className="p-2 bg-cream rounded-lg hover:bg-amber transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4 text-espresso" />
                </button>
                <button
                  onClick={() => deletePhoto(photo.id)}
                  disabled={deletingPhoto === photo.id}
                  className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  title="Hapus"
                >
                  {deletingPhoto === photo.id ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
            <div className="p-2 text-xs text-mahogany/40 truncate">
              {photo.originalName}
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full text-center py-8 bg-cream-card rounded-xl border border-amber/5">
            <Image className="w-8 h-8 text-mahogany/10 mx-auto mb-2" />
            <p className="text-mahogany/30 text-sm">Belum ada foto</p>
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-espresso/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-cream hover:text-amber transition-colors"
            >
              Tutup
            </button>
            <img
              src={previewPhoto.fileUrl || ""}
              alt={previewPhoto.originalName}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}