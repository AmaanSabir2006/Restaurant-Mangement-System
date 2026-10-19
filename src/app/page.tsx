"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import PosTerminal from "@/components/pos/PosTerminal";
import KitchenDisplay from "@/components/kds/KitchenDisplay";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { UserRole } from "@/lib/types";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { soundManager } from "@/lib/sound";
import { Flame } from "lucide-react";

export default function RestaurantApp() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<"pos" | "kds" | "inventory" | "analytics">("pos");
  const [currentRole, setCurrentRole] = useState<UserRole>("CASHIER");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize and listen to real-time events via Server-Sent Events (SSE)
  const { isConnected } = useRealtimeSync();

  // Mount safety to completely prevent SSR hydration mismatch from browser autofill extensions (fdprocessedid)
  useEffect(() => {
    setMounted(true);
    setSoundEnabled(soundManager.isSoundEnabled());
  }, []);

  // When role changes, switch to appropriate default tab
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === "CASHIER") {
      setCurrentTab("pos");
    } else if (role === "KITCHEN") {
      setCurrentTab("kds");
    } else if (role === "INVENTORY_MGR") {
      setCurrentTab("inventory");
    } else if (role === "ADMIN") {
      setCurrentTab("analytics");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] text-slate-100 select-none">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 flex items-center justify-center shadow-xl shadow-orange-500/25 ring-1 ring-orange-400/40">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <span className="font-black text-2xl tracking-tight text-white">
              BURGER<span className="text-orange-500">CRAFT</span>
            </span>
            <p className="text-xs text-slate-400 mt-1 font-medium">Initializing POS & Kitchen Terminal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100" suppressHydrationWarning>
      {/* Top Universal Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
        isRealtimeConnected={isConnected}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Tab View */}
      <main className="flex-1 flex flex-col overflow-hidden" suppressHydrationWarning>
        {currentTab === "pos" && <PosTerminal />}
        {currentTab === "kds" && <KitchenDisplay />}
        {currentTab === "inventory" && <InventoryManagement />}
        {currentTab === "analytics" && <AnalyticsDashboard />}
      </main>
    </div>
  );
}
