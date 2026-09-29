"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("parinaam-theme");
      if (stored === "dark") {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  function selectTheme(mode: "light" | "dark") {
    setTheme(mode);
    try {
      localStorage.setItem("parinaam-theme", mode);
    } catch {}
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Portal Appearance Theme"
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => selectTheme("light")}
        title="Switch to Light Theme"
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
          theme === "light"
            ? "bg-white text-blue-700 shadow-2xs border border-slate-200/80"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => selectTheme("dark")}
        title="Switch to Institutional Deep Navy Dark Theme"
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
          theme === "dark"
            ? "bg-[#F5B83D] text-[#061B2E] shadow-2xs font-extrabold"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}
