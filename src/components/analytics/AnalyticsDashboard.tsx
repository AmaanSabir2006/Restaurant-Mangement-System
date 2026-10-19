"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsSummaryDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  PieChart,
  Flame,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export default function AnalyticsDashboard() {
  const { data, isLoading } = useQuery<{ success: boolean; data: AnalyticsSummaryDto }>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const stats = data?.data;

  // Max value calculation for hourly sales chart scaling
  const maxHourlySale = Math.max(
    10,
    ...(stats?.hourlySales.map((h) => h.sales) || [10])
  );

  // Max item volume for top selling chart scaling
  const maxTopItemQty = Math.max(
    1,
    ...(stats?.topSellingItems.map((i) => i.quantity) || [1])
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-orange-500" />
            <span>Store Operations Analytics & KPIs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time throughput, hourly sales rush trends, kitchen velocity & inventory waste
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Live Store Performance Feed</span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Sales */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today&apos;s Gross Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(stats?.dailySales || 0)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>{stats?.todayOrdersCount || 0} total tickets today</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active In-Flight Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-400 tracking-tight">
            {stats?.activeOrdersCount || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Pending, preparing or ready for pickup
          </p>
        </div>

        {/* Average Prep Time */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg. Kitchen Prep Time
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {stats?.averagePrepTimeMinutes || 0} <span className="text-sm font-bold text-slate-400">mins</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Benchmark target: &lt; 6.0 mins
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Low Stock Reorders
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-400 tracking-tight">
            {stats?.lowStockItemsCount || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Raw items requiring purchase order restock
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Rush Breakdown Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Hourly Sales Velocity</h3>
              <p className="text-xs text-slate-400">Identify lunch & dinner peak rush hours</p>
            </div>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>

          {/* Bar Chart Canvas */}
          <div className="h-64 flex items-end gap-2 pt-6 pb-2 px-1 border-b border-slate-800">
            {stats?.hourlySales.map((item, idx) => {
              const heightPct = Math.max(8, Math.round((item.sales / maxHourlySale) * 100));
              const isPeak = heightPct > 70;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    {item.hour}: {formatCurrency(item.sales)} ({item.orders} orders)
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isPeak
                        ? "bg-gradient-to-t from-orange-600 to-amber-400 group-hover:brightness-125"
                        : "bg-slate-700/80 group-hover:bg-slate-600"
                    }`}
                  />
                  <span className="text-[9px] text-slate-400 transform -rotate-45 sm:rotate-0 origin-center truncate">
                    {item.hour.slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Morning (08:00)</span>
            <span className="font-semibold text-amber-400">Peak Rush Times</span>
            <span>Evening (22:00)</span>
          </div>
        </div>

        {/* Top-Selling Menu Items */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Top-Selling Menu Items</h3>
              <p className="text-xs text-slate-400">Ranked by order volume & total revenue</p>
            </div>
            <Flame className="w-5 h-5 text-orange-400" />
          </div>

          <div className="space-y-3 pt-2">
            {stats?.topSellingItems.map((item, idx) => {
              const widthPct = Math.max(10, Math.round((item.quantity / maxTopItemQty) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 text-slate-500 font-mono">#{idx + 1}</span>
                      <span>{item.name}</span>
                    </span>
                    <span className="font-semibold text-orange-400">
                      {item.quantity} sold ({formatCurrency(item.revenue)})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Consumption Inventory vs Waste Trends */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">
              Inventory Recipe Consumption vs Kitchen Waste Trends
            </h3>
            <p className="text-xs text-slate-400">
              Audit analysis comparing legitimate order recipe deductions against spoilage and drops
            </p>
          </div>
          <PieChart className="w-5 h-5 text-orange-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats?.wasteVsUsage.map((item, idx) => {
            const total = item.usage + item.waste;
            const wasteRatio = total > 0 ? Math.round((item.waste / total) * 100) : 0;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{item.ingredientName}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      wasteRatio > 10
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {wasteRatio}% waste ratio
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-blue-300">
                    Prep Usage: {item.usage} {item.unit}
                  </span>
                  <span className="text-red-300">
                    Waste / Drops: {item.waste} {item.unit}
                  </span>
                </div>

                {/* Progress bar ratio */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${100 - wasteRatio}%` }}
                    className="h-full bg-blue-500"
                    title="Recipe Usage"
                  />
                  <div
                    style={{ width: `${wasteRatio}%` }}
                    className="h-full bg-red-500"
                    title="Waste / Drops"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
