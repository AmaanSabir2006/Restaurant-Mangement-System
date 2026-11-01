"use client";

import React, { useState, useEffect } from "react";
import Navbar, { AppTab } from "@/components/layout/Navbar";
import PosTerminal from "@/components/pos/PosTerminal";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { soundManager } from "@/lib/sound";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function RestaurantApp() {
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState<AppTab>("pos");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Initialize and listen to real-time events via Server-Sent Events (SSE)
  const { isConnected } = useRealtimeSync();

  const applyTheme = (t: "dark" | "light") => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    }
  };

  useEffect(() => {
    setMounted(true);
    setSoundEnabled(soundManager.isSoundEnabled());

    // Restore saved Day/Night theme from localStorage, default to light
    const saved = localStorage.getItem("pw_theme") as "dark" | "light" | null;
    if (saved === "dark") {
      setTheme("dark");
      applyTheme("dark");
    } else {
      setTheme("light");
      applyTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("pw_theme", nextTheme);
    applyTheme(nextTheme);
    soundManager.playClick();
  };

  if (!mounted) {
    return (
      <div
        className="h-screen flex items-center justify-center bg-slate-950 text-slate-100"
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase">
            PIZZA WORLD AND SANAM ICECREAM
          </span>
          <span className="text-[11px] text-slate-400">Loading POS Terminal...</span>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div
        className="h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden select-none"
        suppressHydrationWarning
      >
        {/* Top Universal Header */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isRealtimeConnected={isConnected}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Main Core Functional Tabs */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden" suppressHydrationWarning>
          {currentTab === "pos" && <PosTerminal />}
          {currentTab === "stock" && <InventoryManagement />}
          {currentTab === "analytics" && <AnalyticsDashboard />}
        </main>
      </div>
    </LanguageProvider>
  );
}
