"use client";

import React from "react";
import {
  ShoppingBag,
  Boxes,
  BarChart2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { soundManager } from "@/lib/sound";
import { useLanguage } from "@/lib/LanguageContext";

export type AppTab = "pos" | "stock" | "analytics";

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  isRealtimeConnected: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  cashierName?: string;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  isRealtimeConnected,
  soundEnabled,
  setSoundEnabled,
  cashierName = "M. Hamza",
  theme = "dark",
  toggleTheme,
}: NavbarProps) {
  const { toggleLanguage, t, isUrdu } = useLanguage();

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.playSuccessTone();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700/80 shadow-sm shrink-0">
      <div className="w-full px-4 sm:px-5 flex items-center justify-between h-16 gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm text-xl shrink-0 font-bold">
            🍕
          </div>
          <div className="min-w-0">
            <span className="font-black text-base sm:text-lg tracking-tight text-slate-100 whitespace-nowrap">
              {isUrdu ? (
                <>
                  <span>{t("PIZZA WORLD")}</span>{" "}
                  <span className="text-xs text-slate-400 font-normal">{t("AND")}</span>{" "}
                  <span className="text-orange-600 dark:text-orange-400">{t("SANAM ICECREAM")}</span>
                </>
              ) : (
                <>
                  PIZZA <span className="text-orange-600">WORLD</span>{" "}
                  <span className="text-xs text-slate-400 font-normal">AND</span>{" "}
                  <span className="text-orange-600 dark:text-orange-400">SANAM ICECREAM</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Center Navigation: Billing | Stock & Deliveries | Sales & Reports */}
        <nav className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            suppressHydrationWarning
            onClick={() => setCurrentTab("pos")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === "pos"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t("Billing (POS)")}</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => setCurrentTab("stock")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === "stock"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>{t("Daily Supplies & Khata")}</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => setCurrentTab("analytics")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === "analytics"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{t("Sales & Reports")}</span>
          </button>
        </nav>

        {/* Right Tools: Language switch, Audio chime toggle, Theme toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Switcher (English <-> اردو) */}
          <button
            suppressHydrationWarning
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isUrdu
                ? "border-emerald-500 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60"
                : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
            }`}
            title={isUrdu ? "Switch to English" : "اردو میں تبدیل کریں (Switch to Urdu)"}
          >
            <Languages className={`w-3.5 h-3.5 ${isUrdu ? "text-emerald-400" : "text-orange-400"}`} />
            <span className="font-bold">{isUrdu ? "English" : "اردو"}</span>
          </button>

          {/* Audio alert toggle */}
          <button
            suppressHydrationWarning
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-slate-800 text-amber-500 border-slate-700 hover:bg-slate-700"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
            }`}
            title={soundEnabled ? t("Order chime enabled") : t("Order chime muted")}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Day / Night Theme Toggle */}
          {toggleTheme && (
            <button
              suppressHydrationWarning
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100 text-xs font-bold transition-all cursor-pointer"
              title={
                theme === "dark"
                  ? "Night Mode Active • Click for Day (Light) Mode"
                  : "Day Mode Active • Click for Night (Dark) Mode"
              }
            >
              {theme === "dark" ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline text-xs font-semibold">{t("Night")}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline text-xs font-semibold">{t("Day")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
