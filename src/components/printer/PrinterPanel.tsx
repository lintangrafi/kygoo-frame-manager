"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Printer,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  X,
  Image,
  Clock,
  Trash2,
  Settings,
  Monitor,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useUIStore } from "@/store";

interface PrintJob {
  id: string;
  compositionId: string;
  frameName: string;
  printSize: string;
  imageUrl: string;
  thumbnailUrl?: string;
  timestamp: number;
  status: "pending" | "sent" | "printed" | "cancelled";
  retryCount: number;
}

interface PrinterPanelProps {
  compositionId?: string;
  exportUrl?: string;
  frameName?: string;
  onPrintComplete?: (jobId: string) => void;
}

export function PrinterPanel({ compositionId, exportUrl, frameName, onPrintComplete }: PrinterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [sending, setSending] = useState(false);
  const [lastSentJob, setLastSentJob] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const addToast = useUIStore((state) => state.addToast);

  // Poll for print jobs
  const pollJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/printer/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setServerTime(data.serverTime);
        setIsConnected(true);

        // Check if any job was completed
        const completedJob = data.jobs?.find(
          (j: PrintJob) => j.status === "printed" && j.id === lastSentJob
        );
        if (completedJob && onPrintComplete) {
          onPrintComplete(completedJob.id);
          addToast({
            type: "success",
            title: "Cetak Selesai",
            message: `Frame ${completedJob.frameName} telah dicetak`,
          });
        }
      }
    } catch {
      setIsConnected(false);
    }
  }, [lastSentJob, onPrintComplete, addToast]);

  // Start polling when expanded
  useEffect(() => {
    if (isExpanded) {
      pollJobs();
      pollIntervalRef.current = setInterval(pollJobs, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isExpanded, pollJobs]);

  // Send to printer
  const sendToPrinter = async (printSize?: string) => {
    if (!compositionId || !exportUrl) {
      addToast({
        type: "error",
        title: "Gagal",
        message: "Export belum tersedia",
      });
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/printer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositionId,
          printSize: printSize || "4R",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim ke printer");
      }

      setLastSentJob(data.jobId);
      addToast({
        type: "info",
        title: "Terkirim",
        message: `Frame dikirim ke printer (Job: ${data.jobId})`,
      });

      // Start polling immediately
      pollJobs();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Gagal Kirim",
        message: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  // Cancel job
  const cancelJob = async (jobId: string) => {
    try {
      await fetch("/api/printer/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: "cancelled" }),
      });

      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      addToast({
        type: "success",
        title: "Dibatalkan",
        message: "Job print dibatalkan",
      });
    } catch {
      addToast({
        type: "error",
        title: "Gagal",
        message: "Tidak dapat membatalkan job",
      });
    }
  };

  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const completedJobs = jobs.filter((j) => j.status === "printed");

  return (
    <div className="bg-cream-card rounded-2xl border border-amber/10 shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-amber/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConnected ? "bg-amber/10" : "bg-mahogany/10"
            }`}
          >
            <Printer
              className={`w-5 h-5 ${
                isConnected ? "text-amber" : "text-mahogany/30"
              }`}
            />
          </div>
          <div className="text-left">
            <div className="font-bold text-sm text-espresso">Printer</div>
            <div className="flex items-center gap-1.5 text-[10px] text-mahogany/50">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Terhubung</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Menunggu koneksi...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pendingJobs.length > 0 && (
            <div className="px-2 py-1 bg-amber/10 text-amber text-xs font-semibold rounded-full">
              {pendingJobs.length} antri
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-mahogany/30" />
          ) : (
            <ChevronDown className="w-5 h-5 text-mahogany/30" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-amber/5 pt-4 space-y-4">
          {/* Send to Printer Button */}
          <div className="flex gap-2">
            <button
              onClick={() => sendToPrinter()}
              disabled={!compositionId || !exportUrl || sending}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-espresso text-cream rounded-xl text-sm font-bold hover:bg-mahogany transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              {sending ? "Mengirim..." : "Kirim ke Printer"}
            </button>
            <button
              onClick={pollJobs}
              className="p-3 bg-cream border border-amber/10 rounded-xl hover:border-amber transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-mahogany/50" />
            </button>
          </div>

          {/* Print Size Selection */}
          <div className="flex gap-2">
            {["2R", "4R", "8R"].map((size) => (
              <button
                key={size}
                onClick={() => sendToPrinter(size)}
                disabled={!compositionId || !exportUrl || sending}
                className="flex-1 py-2 text-xs font-semibold border border-amber/10 rounded-lg hover:border-amber hover:bg-amber/5 transition-colors disabled:opacity-50"
              >
                {size}
              </button>
            ))}
          </div>

          {/* Pending Jobs */}
          {pendingJobs.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-mahogany/40 uppercase tracking-wider mb-2">
                Antrian Print
              </div>
              <div className="space-y-2">
                {pendingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-amber/5"
                  >
                    <div className="w-10 h-10 bg-amber/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {job.thumbnailUrl ? (
                        <img
                          src={job.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Image className="w-5 h-5 text-amber" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-espresso truncate">
                        {job.frameName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-mahogany/40">
                        <span>{job.printSize}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(job.timestamp).toLocaleTimeString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelJob(job.id)}
                      className="p-2 text-mahogany/30 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Printed */}
          {completedJobs.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-mahogany/40 uppercase tracking-wider mb-2">
                Baru Saja Dicetak
              </div>
              <div className="space-y-2">
                {completedJobs.slice(-3).reverse().map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-espresso">
                        {job.frameName}
                      </div>
                      <div className="text-[10px] text-green-600">
                        Selesai {new Date(job.timestamp).toLocaleTimeString("id-ID")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection Help */}
          {!isConnected && (
            <div className="p-4 bg-amber/5 rounded-xl border border-amber/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-espresso">
                    Tidak ada printer terhubung
                  </div>
                  <div className="text-xs text-mahogany/50 mt-1">
                    Printer laptop/PC akan otomatis terdeteksi saat terhubung ke
                    aplikasi melalui jaringan yang sama.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <button className="flex items-center gap-2 text-xs text-mahogany/40 hover:text-mahogany transition-colors">
            <Settings className="w-4 h-4" />
            Pengaturan Printer
          </button>
        </div>
      )}
    </div>
  );
}

// Standalone Printer Dashboard
export function PrinterDashboard() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const addToast = useUIStore((state) => state.addToast);

  const pollJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/printer/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setIsConnected(true);
      }
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    pollJobs();
    const interval = setInterval(pollJobs, 3000);
    return () => clearInterval(interval);
  }, [pollJobs]);

  const markAsPrinted = async (jobId: string) => {
    await fetch("/api/printer/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, status: "printed" }),
    });
    pollJobs();
    addToast({
      type: "success",
      title: "Dicetak",
      message: "Status job diperbarui",
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80">
      <div className="bg-cream-card rounded-2xl border border-amber/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-espresso flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber" />
            <span className="text-cream font-bold text-sm">Lumabooth Assistant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-cream/60 text-xs">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Jobs List */}
        <div className="max-h-64 overflow-y-auto p-3 space-y-2">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-mahogany/30">
              <Printer className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Tidak ada job print</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-3 p-2 bg-cream rounded-xl border border-amber/5"
              >
                <div className="w-10 h-10 bg-amber/10 rounded-lg overflow-hidden flex-shrink-0">
                  {job.thumbnailUrl ? (
                    <img
                      src={job.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-5 h-5 text-amber" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-espresso truncate">
                    {job.frameName}
                  </div>
                  <div className="text-[10px] text-mahogany/40">
                    {job.printSize} • {new Date(job.timestamp).toLocaleTimeString("id-ID")}
                  </div>
                </div>
                {job.status === "pending" && (
                  <button
                    onClick={() => markAsPrinted(job.id)}
                    className="px-2 py-1 bg-green-500 text-cream text-[10px] font-semibold rounded-lg hover:bg-green-600"
                  >
                    Cetak
                  </button>
                )}
                {job.status === "printed" && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-cream border-t border-amber/5 flex items-center justify-between">
          <span className="text-[10px] text-mahogany/40">
            {jobs.filter((j) => j.status === "pending").length} antri
          </span>
          <button
            onClick={pollJobs}
            className="text-[10px] text-amber hover:text-amber-glow"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
