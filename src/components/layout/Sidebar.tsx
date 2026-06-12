"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Camera, Image, LogOut, Sparkles, Users } from "lucide-react";

const links = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/sessions", label: "Sesi", icon: Camera },
  { href: "/staff/frames", label: "Frame", icon: Image },
  { href: "/today", label: "Pelanggan", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-espresso flex flex-col relative grain-overlay">
      {/* Brand header */}
      <div className="px-5 py-6 border-b border-amber/10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber" />
          <h1 className="font-display text-2xl font-bold italic text-amber tracking-tight">
            Kygoo
          </h1>
        </div>
        <p className="text-cacao text-[11px] tracking-widest uppercase pl-7">Frame Studio</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 relative z-10">
        {links.map((link) => {
          const Icon = link.icon;
          const active = link.href === "/today"
            ? pathname.startsWith("/today") || pathname.startsWith("/s/")
            : pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-amber text-espresso shadow-lg shadow-amber/20"
                  : "text-cream/60 hover:text-cream hover:bg-cream/5"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", active && "text-espresso")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-amber/10 relative z-10">
        <form action="/api/auth/logout" method="POST">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-cream/40 hover:text-cream/80 hover:bg-cream/5 transition-all duration-200 w-full">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
