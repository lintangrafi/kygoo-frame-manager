import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { DarkModeScript } from "@/components/ui/DarkMode";
import { PWAProvider } from "@/components/pwa/PWAProvider";

export const metadata: Metadata = {
  title: "Kygoo Frame Studio",
  description: "Photo frame editor for Kygoo Studios - Create beautiful photo compositions",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kygoo Frame",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  themeColor: "#D4872B",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <DarkModeScript />
      </head>
      <body className="bg-cream text-espresso antialiased min-h-screen dark:bg-gray-900 dark:text-gray-100">
        <QueryProvider>
          <PWAProvider>
            {children}
            <ToastContainer />
          </PWAProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
