import { Sidebar } from "@/components/layout/Sidebar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-warm-paper">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
