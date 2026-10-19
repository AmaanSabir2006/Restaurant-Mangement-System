"use client";

import React from "react";
import { UserRole } from "@/lib/types";
import {
  Flame,
  ChefHat,
  ShoppingBag,
  Boxes,
  BarChart3,
  Volume2,
  VolumeX,
  Radio,
  UserCheck,
} from "lucide-react";
import { soundManager } from "@/lib/sound";

interface NavbarProps {
  currentTab: "pos" | "kds" | "inventory" | "analytics";
  setCurrentTab: (tab: "pos" | "kds" | "inventory" | "analytics") => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isRealtimeConnected: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: "CASHIER", label: "Alex Rivera", desc: "Cashier" },
  { role: "KITCHEN", label: "Marco Chen", desc: "Head Cook" },
  { role: "INVENTORY_MGR", label: "Sarah Jenkins", desc: "Stock Mgr" },
  { role: "ADMIN", label: "David Miller", desc: "General Mgr" },
];

export default function Navbar({
  currentTab,
  setCurrentTab,
  currentRole,
  setCurrentRole,
  isRealtimeConnected,
  soundEnabled,
  setSoundEnabled,
}: NavbarProps) {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.playSuccessTone();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">
                  BURGER<span className="text-orange-500">CRAFT</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
                  v2.4 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Fast Food POS & Kitchen OS
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setCurrentTab("pos")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "pos"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>POS Terminal</span>
            </button>

            <button
              onClick={() => setCurrentTab("kds")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
                currentTab === "kds"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen Display</span>
            </button>

            <button
              onClick={() => setCurrentTab("inventory")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "inventory"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Inventory & BOM</span>
            </button>

            <button
              onClick={() => setCurrentTab("analytics")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "analytics"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right Tools: Real-time status, Audio chime toggle, Role switcher */}
          <div className="flex items-center gap-3">
            {/* Realtime Live Indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isRealtimeConnected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
              title={
                isRealtimeConnected
                  ? "Real-time SSE channel active"
                  : "Connecting to real-time events..."
              }
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isRealtimeConnected ? "animate-pulse text-emerald-400" : "text-amber-400"
                }`}
              />
              <span>{isRealtimeConnected ? "Live SSE" : "Connecting..."}</span>
            </div>

            {/* Audio alert toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled
                  ? "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700"
                  : "bg-slate-800/40 text-slate-500 border-slate-700/50 hover:bg-slate-800"
              }`}
              title={soundEnabled ? "Order chime enabled" : "Order chime muted"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-800/80 pl-2 pr-1.5 py-1 rounded-xl border border-slate-700/60">
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {ROLES.map((r) => (
                  <option key={r.role} value={r.role} className="bg-slate-900 text-white">
                    {r.label} ({r.desc})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
