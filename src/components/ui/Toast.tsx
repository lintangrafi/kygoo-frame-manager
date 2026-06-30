"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const iconStyles = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              ${toastStyles[toast.type]}
              rounded-xl p-4 shadow-lg border
              animate-slide-in-right
              flex items-start gap-3
            `}
          >
            <Icon className={`w-5 h-5 ${iconStyles[toast.type]} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{toast.title}</div>
              {toast.message && (
                <div className="text-xs opacity-80 mt-1">{toast.message}</div>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="text-xs font-semibold mt-2 underline hover:no-underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Hook for easy toast usage
export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (title: string, message?: string, action?: { label: string; onClick: () => void }) =>
      addToast({ type: "success", title, message, action }),
    error: (title: string, message?: string, action?: { label: string; onClick: () => void }) =>
      addToast({ type: "error", title, message, action, duration: 8000 }),
    info: (title: string, message?: string, action?: { label: string; onClick: () => void }) =>
      addToast({ type: "info", title, message, action }),
    warning: (title: string, message?: string, action?: { label: string; onClick: () => void }) =>
      addToast({ type: "warning", title, message, action }),
  };
}
