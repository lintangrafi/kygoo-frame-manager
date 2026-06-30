"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Wifi, WifiOff, Bell, BellOff, Maximize2, RefreshCw } from "lucide-react";
import { useUIStore } from "@/store";

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [serviceWorker, setServiceWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const addToast = useUIStore((state) => state.addToast);

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        type: "success",
        title: "Koneksi Pulih",
        message: "Anda kembali terhubung ke internet",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: "warning",
        title: "Offline",
        message: "Anda sedang tidak terhubung ke internet",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast]);

  // Service worker registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          setServiceWorker(registration.active);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Listen for controller change (new SW activated)
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    }
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detect if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Handle app installed
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      addToast({
        type: "success",
        title: "Berhasil Install",
        message: "Kygoo Frame Studio telah ditambahkan ke perangkat Anda",
      });
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [addToast]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      addToast({
        type: "success",
        title: "Install Dimulai",
        message: "Silakan tunggu proses instalasi selesai",
      });
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [deferredPrompt, addToast]);

  const handleUpdate = useCallback(() => {
    if (serviceWorker) {
      serviceWorker.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [serviceWorker]);

  return (
    <>
      {children}

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="flex gap-2 p-2">
          {/* Online/Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-mahogany text-cream rounded-full text-xs font-semibold shadow-lg pointer-events-auto animate-bounce">
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode
            </div>
          )}

          {/* Update available */}
          {updateAvailable && (
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber text-espresso rounded-full text-xs font-semibold shadow-lg pointer-events-auto hover:bg-amber-glow transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Tersedia
            </button>
          )}

          {/* Install prompt */}
          {isInstallable && !window.matchMedia("(display-mode: standalone)").matches && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-1.5 bg-espresso text-cream rounded-full text-xs font-semibold shadow-lg pointer-events-auto hover:bg-mahogany transition-colors animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Install prompt banner component
interface InstallBannerProps {
  onDismiss?: () => void;
}

export function InstallBanner({ onDismiss }: InstallBannerProps) {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-cream-card border border-amber/20 rounded-2xl p-4 shadow-2xl shadow-amber/10">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-amber/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-amber" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-espresso text-sm">Install App</h4>
            <p className="text-mahogany/60 text-xs mt-1">
              Tambahkan ke layar utama untuk pengalaman terbaik dan akses offline
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="text-mahogany/30 hover:text-mahogany"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setVisible(false)}
            className="flex-1 py-2 text-xs text-mahogany/50 hover:text-mahogany"
          >
            Nanti
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2 bg-espresso text-cream text-xs font-semibold rounded-lg hover:bg-mahogany"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

// Kiosk mode controller
interface KioskModeProps {
  sessionUrl: string;
  enabled: boolean;
}

export function KioskModeController({ sessionUrl, enabled }: KioskModeProps) {
  useEffect(() => {
    if (!enabled) return;

    // Request fullscreen
    const requestFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.error("Fullscreen request failed:", error);
      }
    };

    // Lock screen wake state
    if ("wakeLock" in navigator) {
      (navigator as any).wakeLock.request("screen").catch(console.error);
    }

    // Prevent context menu
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Request fullscreen on first interaction
    document.addEventListener("click", requestFullscreen, { once: true });

    return () => {
      document.removeEventListener("click", requestFullscreen);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => document.documentElement.requestFullscreen()}
        className="p-2 bg-espresso/80 text-cream rounded-lg hover:bg-espresso backdrop-blur-sm"
        title="Fullscreen"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Push notification toggle
export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setEnabled(Notification.permission === "granted");
    }
  }, []);

  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Browser tidak mendukung notifications");
      return;
    }

    if (Notification.permission === "granted") {
      setEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      setEnabled(permission === "granted");
    }
  };

  return (
    <button
      onClick={toggleNotifications}
      className={`p-2 rounded-lg transition-colors ${
        enabled ? "bg-amber text-espresso" : "bg-cream-card text-mahogany/50"
      }`}
      title={enabled ? "Matikan notifikasi" : "Aktifkan notifikasi"}
    >
      {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
    </button>
  );
}
