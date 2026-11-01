"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnalyticsSummaryDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import DailyBusinessLogView from "../inventory/DailyBusinessLogView";
import ResetAnalyticsMonthModal from "./ResetAnalyticsMonthModal";
import LowStockModal from "./LowStockModal";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  Search,
  FileText,
  Calendar,
  RotateCcw,
  ChevronDown,
  Layers,
  Wallet,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function AnalyticsDashboard() {
  const queryClient = useQueryClient();
  const { t, isUrdu } = useLanguage();

  const today = new Date();
  const defaultMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [activeView, setActiveView] = useState<"overview" | "daily-log">("overview");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthKey);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState<boolean>(false);

  const { data, isLoading } = useQuery<{ success: boolean; data: AnalyticsSummaryDto }>({
    queryKey: ["analytics", selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?month=${selectedMonth}`);
      return res.json();
    },
    refetchInterval: 10000,
  });

  const stats = data?.data;
  const availableMonths = stats?.availableMonths || [];
  const monthLabel = stats?.monthLabel || "Current Month";
  const isMonthReset = Boolean(stats?.isMonthReset);

  // Max value calculation for hourly sales chart scaling
  const maxHourlySale = Math.max(
    10,
    ...(stats?.hourlySales.map((h) => h.sales) || [10])
  );

  const fastFoodSales = stats?.fastFoodSales || [];
  const filteredItems = fastFoodSales.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-5">
      {/* Friendly Header with View Switcher, Month Selector & Reset at End of Month Button */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-orange-500" />
            <span>{t("Sales & Business Reports")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("Sales earnings, best-selling fast food, and comprehensive daily day-end business logs.")}
          </p>
        </div>

        {/* Action Controls: View Switcher, Month Selector, Reset at End of Month */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl pl-8 pr-8 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm transition-all"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.orders} orders)
                </option>
              ))}
              <option value="ALL">All Time History</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Start Fresh / Reset All to 0 Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Make all counters Rs. 0 and start fresh"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("Start Fresh (All 0)")}</span>
          </button>

          {/* Reset at the End of the Month Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Reset monthly sales & order counters to Rs. 0 at the end of the month"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span>{t("Reset Month Total")}</span>
          </button>

          {/* View Switcher: Sales Overview vs Daily Log */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "overview"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{t("Sales & Top Items")}</span>
            </button>

            <button
              onClick={() => setActiveView("daily-log")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "daily-log"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t("Daily Log (روزنامچہ)")}</span>
            </button>
          </div>
        </div>
      </div>

      {activeView === "daily-log" ? (
        <DailyBusinessLogView />
      ) : (
        <>
          {/* If month is reset notification banner */}
          {isMonthReset && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>{monthLabel}</strong> is reset to <strong>Rs. 0</strong>. Ready for fresh new orders!
                  {stats?.archivedSnapshot && (
                    <span className="text-slate-400 ml-1">
                      (Archived previous: {formatCurrency(stats.archivedSnapshot.totalSales || 0)} sales • {stats.archivedSnapshot.totalOrders || 0} orders)
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] cursor-pointer shrink-0 self-start sm:self-auto"
              >
                Archive Settings
              </button>
            </div>
          )}

          {/* 4 Big Simple Metric Cards with Month Total & Supplies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Today's Sales */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {t("Today's Total Sales")}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
                  {formatCurrency(stats?.dailySales || 0)}
                </div>
                <span className="text-xs text-emerald-400 font-semibold mt-1 block">
                  +{stats?.todayOrdersCount || 0} {t("customer orders")}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Month's Total Sales */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {t("Month Sales")} ({monthLabel.split(" ")[0]})
                  </span>
                  {isMonthReset && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 font-black">
                      Reset
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-orange-400 mt-1">
                  {formatCurrency(stats?.monthSales !== undefined ? stats.monthSales : stats?.totalRevenue || 0)}
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 block">
                  {stats?.monthOrdersCount || 0} {t("orders this month")}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Average Order Value (Pure Sales Focus - Khata removed) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {t("Avg. Order Value")}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
                  {formatCurrency(stats?.avgTicketValue || 0)}
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 block">
                  {t("Avg. sales bill per customer order")}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Low Stock Items (Clickable to display low stock items) */}
            <div
              onClick={() => setIsLowStockModalOpen(true)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-red-500/60 hover:bg-slate-850/80 shadow-sm flex items-center justify-between cursor-pointer transition-all group select-none"
              title="Click to view all items running low"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block group-hover:text-slate-200 transition-colors">
                    {t("Items Running Low")}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold group-hover:bg-red-500/25 transition-colors">
                    {t("Click to view")}
                  </span>
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-black mt-1 ${
                    stats?.lowStockItemsCount ? "text-red-400" : "text-slate-100"
                  }`}
                >
                  {stats?.lowStockItemsCount || 0}
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 block group-hover:text-red-300 transition-colors">
                  {stats?.lowStockItemsCount ? `${t("Needs restock soon")} (Click to view →)` : `${t("Stock is healthy")} (Click to view →)`}
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-105 ${
                  stats?.lowStockItemsCount
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Best-Selling Fast Food Items Table */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <span>🏆</span>
                  <span>{t("Best-Selling Fast Food Items")} ({monthLabel})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by quantity sold and money earned for the selected month
                </p>
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Filter food item...")}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="p-3">{t("Rank")}</th>
                    <th className="p-3">{t("Item Name")}</th>
                    <th className="p-3">{t("Category")}</th>
                    <th className="p-3 text-center">{t("Quantity Sold")}</th>
                    <th className="p-3 text-right">{t("Total Money Made")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No sales data found for {monthLabel}. As fast food orders are billed in the POS, sales rankings will appear here!
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-400">
                          {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-bold text-slate-100">
                          {t(item.name)}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                            {t(item.category)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-orange-600/10 text-orange-400 font-bold text-xs border border-orange-500/20">
                            {item.quantity} sold
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-400 text-sm">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rush Hour Velocity Chart */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span>Busiest Hours (Rush Times)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Peak customer ordering hours during lunch and dinner
                </p>
              </div>
            </div>

            {/* Clean Bar Chart */}
            <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 px-1 border-b border-slate-700">
              {stats?.hourlySales.map((item, idx) => {
                const heightPct = Math.max(8, Math.round((item.sales / maxHourlySale) * 100));
                const isPeak = heightPct > 70;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                  >
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 text-slate-100 text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      {item.hour}: {formatCurrency(item.sales)}
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        isPeak
                          ? "bg-orange-600 group-hover:bg-orange-500"
                          : "bg-slate-700 group-hover:bg-slate-600"
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 truncate">
                      {item.hour.slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>08:00 (Morning)</span>
              <span className="text-orange-400 font-bold">Orange bars indicate rush hours</span>
              <span>23:00 (Late Night)</span>
            </div>
          </div>
        </>
      )}

      {/* Reset at the End of the Month Modal */}
      <ResetAnalyticsMonthModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
          queryClient.invalidateQueries({ queryKey: ["supplies"] });
          queryClient.invalidateQueries({ queryKey: ["daily-log"] });
        }}
        monthKey={selectedMonth}
        monthLabel={monthLabel}
        monthSales={stats?.monthSales !== undefined ? stats.monthSales : stats?.totalRevenue || 0}
        monthOrdersCount={stats?.monthOrdersCount || 0}
        monthSuppliesCost={stats?.monthSuppliesCost || 0}
        isMonthReset={isMonthReset}
      />

      {/* Low Stock Items Display Modal */}
      <LowStockModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        items={stats?.lowStockItems || []}
      />
    </div>
  );
}
