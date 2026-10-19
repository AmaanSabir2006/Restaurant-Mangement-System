"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderDto, OrderStatus } from "@/lib/types";
import { getElapsedMinutes, getElapsedSeconds, formatTimer } from "@/lib/utils";
import { soundManager } from "@/lib/sound";
import {
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Utensils,
  ShoppingBag,
  Car,
  Truck,
  Volume2,
  VolumeX,
  AlertTriangle,
  Flame,
  CheckCheck,
} from "lucide-react";

export default function KitchenDisplay() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [secondsTick, setSecondsTick] = useState<number>(0);

  // Live ticking timer effect every second to update elapsed prep time counters
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Active Orders for KDS (PENDING, PREPARING, READY)
  const { data, isLoading } = useQuery<{ success: boolean; orders: OrderDto[] }>({
    queryKey: ["orders", "active"],
    queryFn: async () => {
      const res = await fetch("/api/orders?active=true&limit=60");
      return res.json();
    },
    refetchInterval: 4000, // Background polling safety net alongside SSE
  });

  const orders = data?.orders || [];

  // Sort orders by urgency: oldest first (longest waiting)
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const filteredOrders = sortedOrders.filter((o) => {
    if (statusFilter === "ALL") return true;
    return o.status === statusFilter;
  });

  // Mutate Order Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.order;
    },
    onSuccess: (updatedOrder) => {
      soundManager.playSuccessTone();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (err: any) => {
      alert(`Status update failed: ${err.message}`);
    },
  });

  // Urgency classification helper
  const getUrgencyConfig = (order: OrderDto) => {
    // If prep has started, measure from prepStartTime; else from createdAt
    const startTime = order.prepStartTime || order.createdAt;
    const elapsedMins = getElapsedMinutes(startTime);

    if (order.status === "READY") {
      return {
        level: "ready",
        borderColor: "border-blue-500/60",
        headerBg: "bg-blue-950/70 text-blue-300",
        timerColor: "text-blue-400",
        label: "READY FOR PICKUP",
      };
    }

    if (elapsedMins < 5) {
      return {
        level: "green",
        borderColor: "border-emerald-500/50",
        headerBg: "bg-emerald-950/70 text-emerald-300",
        timerColor: "text-emerald-400",
        label: "ON TIME (< 5m)",
      };
    } else if (elapsedMins < 10) {
      return {
        level: "yellow",
        borderColor: "border-amber-500/60",
        headerBg: "bg-amber-950/70 text-amber-300",
        timerColor: "text-amber-400",
        label: "ATTENTION (5-10m)",
      };
    } else {
      return {
        level: "red",
        borderColor: "border-red-500/80 shadow-red-500/20 shadow-lg",
        headerBg: "bg-red-950/90 text-red-300 animate-pulse",
        timerColor: "text-red-400 font-black",
        label: "URGENT RUSH (> 10m)",
      };
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "DRIVE_THRU":
        return <Car className="w-4 h-4 text-amber-400" />;
      case "TAKEAWAY":
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case "DELIVERY":
        return <Truck className="w-4 h-4 text-purple-400" />;
      default:
        return <Utensils className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Count metrics
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const preparingCount = orders.filter((o) => o.status === "PREPARING").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Top KDS Control Bar */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              Kitchen Display System (KDS)
            </h2>
            <p className="text-xs text-slate-400">
              Live orders ordered by urgency & prep duration
            </p>
          </div>
        </div>

        {/* Filter Badges & Status Counts */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Active ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "PENDING"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-400/90 hover:text-amber-300"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("PREPARING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "PREPARING"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-blue-400 hover:text-blue-300"
            }`}
          >
            Preparing ({preparingCount})
          </button>
          <button
            onClick={() => setStatusFilter("READY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "READY"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            Ready ({readyCount})
          </button>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">&lt; 5m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-400">5-10m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-400">&gt; 10m Urgent</span>
          </div>
        </div>
      </div>

      {/* Main Ticket Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <CheckCheck className="w-16 h-16 text-emerald-500/60 mb-3" />
            <h3 className="text-lg font-bold text-white">All Kitchen Tickets Cleared!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No active tickets in this view. New orders will chime and appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
            {filteredOrders.map((order) => {
              const urgency = getUrgencyConfig(order);
              const elapsedSec = getElapsedSeconds(order.prepStartTime || order.createdAt);
              const formattedElapsed = formatTimer(elapsedSec);

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900/95 rounded-2xl border-2 ${urgency.borderColor} overflow-hidden shadow-xl transition-all duration-200 flex flex-col`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between border-b border-slate-800 ${urgency.headerBg}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-white">
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 text-[11px] font-bold">
                        {getOrderTypeIcon(order.orderType)}
                        <span>{order.orderType.replace("_", " ")}</span>
                      </div>
                    </div>

                    {/* Live Ticking Timer */}
                    <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                      <Clock className="w-3.5 h-3.5" />
                      <span className={urgency.timerColor}>{formattedElapsed}</span>
                    </div>
                  </div>

                  {/* Customer / Destination Info */}
                  <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {order.customerName || "Walk-in Guest"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {urgency.label}
                    </span>
                  </div>

                  {/* Order Items List */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[340px]">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-black text-xs flex items-center justify-center border border-orange-500/30">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-white text-sm">
                              {item.menuItem?.name || "Item"}
                            </span>
                          </div>
                        </div>

                        {/* Modifiers Badges */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="pl-8 flex flex-wrap gap-1 pt-0.5">
                            {item.modifiers.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase"
                              >
                                + {m.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Special Kitchen Notes */}
                        {item.notes && (
                          <div className="pl-8 text-[11px] text-amber-300/90 font-medium italic">
                            &quot;{item.notes}&quot;
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Order Level General Notes */}
                    {order.notes && (
                      <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>Order Note: {order.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Progression Buttons */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                    {order.status === "PENDING" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            orderId: order.id,
                            status: "PREPARING",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Prep (Deduct BOM)</span>
                      </button>
                    )}

                    {order.status === "PREPARING" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            orderId: order.id,
                            status: "READY",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {order.status === "READY" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            orderId: order.id,
                            status: "COMPLETED",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Complete / Picked Up</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
