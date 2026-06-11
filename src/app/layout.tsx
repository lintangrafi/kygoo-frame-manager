import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kygoo Frame Studio",
  description: "Photo frame editor for Kygoo Studios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-cream text-espresso antialiased min-h-screen">{children}</body>
    </html>
  );
}
