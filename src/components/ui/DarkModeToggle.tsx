"use client";

import { useUIStore } from "@/store";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle({ className = "" }: { className?: string }) {
  const { isDarkMode, toggleDarkMode } = useUIStore();

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        relative p-2 rounded-lg transition-all duration-300
        ${isDarkMode
          ? "bg-amber/20 text-amber hover:bg-amber/30"
          : "bg-espresso/10 text-espresso hover:bg-espresso/20"
        }
        dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
        ${className}
      `}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300
            ${isDarkMode ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}
          `}
        />
        {/* Moon icon */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300
            ${isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}
          `}
        />
      </div>
    </button>
  );
}
