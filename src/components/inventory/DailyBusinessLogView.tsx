"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DailyLogResponseDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import SettlePaymentModal from "./SettlePaymentModal";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";

interface DailyBusinessLogViewProps {
  initialDate?: string;
}

export default function DailyBusinessLogView({ initialDate }: DailyBusinessLogViewProps) {
  const queryClient = useQueryClient();

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayStr());

  // Settlement modal state
  const [settleModalState, setSettleModalState] = useState<{
    isOpen: boolean;
    supplyId?: string;
    personName: string;
    itemName?: string;
    pendingAmount: number;
  }>({
    isOpen: false,
    personName: "",
    pendingAmount: 0,
  });

  const { data: logData, isLoading } = useQuery<DailyLogResponseDto>({
    queryKey: ["daily-log", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/daily-log?date=${selectedDate}`);
      return res.json();
    },
    refetchInterval: 10000,
  });

  const changeDateByDays = (delta: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() + delta);
    setSelectedDate(dateObj.toISOString().slice(0, 10));
  };

  const setDateToToday = () => {
    setSelectedDate(getTodayStr());
  };

  const setDateToYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const sales = logData?.salesSummary;
  const supplies = logData?.suppliesSummary;
  const vendors = logData?.vendorSettlementSummary || [];
  const cashFlow = logData?.cashFlow;

  const totalSales = sales?.totalRevenue || 0;
  const totalSuppliesCost = supplies?.totalCost || 0;
  const totalCashPaidOut = supplies?.totalPaid || 0;
  const totalPendingUdhaar = supplies?.totalPending || 0;
  const netCashFlow = (cashFlow?.netCashFlow !== undefined) ? cashFlow.netCashFlow : (totalSales - totalCashPaidOut);

  return (
    <div className="space-y-5">
      {/* Date Header & Control Bar */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span>Daily Business Log (روزنامچہ)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Day-End Summary
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete daily register: Sales earned, items sold, supplies brought, who was paid and who is left.
          </p>
        </div>

        {/* Date Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => changeDateByDays(-1)}
              title="Previous Day"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 px-2.5 py-1 focus:outline-none cursor-pointer"
            />

            <button
              onClick={() => changeDateByDays(1)}
              title="Next Day"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={setDateToToday}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedDate === getTodayStr()
                ? "bg-orange-600 text-white border-orange-500 shadow-sm"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
            }`}
          >
            Today
          </button>

          <button
            onClick={setDateToYesterday}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Yesterday
          </button>

          <button
            onClick={handlePrint}
            title="Print daily register sheet"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Printable Date Banner */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">
            Daily Register for
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5">
            {logData?.formattedDate || selectedDate}
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-300">PIZZA WORLD &amp; SANAM ICECREAM</span>
          <span className="text-[11px] text-slate-400 block">POS Daily Summary Register</span>
        </div>
      </div>

      {/* 5 Daily Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Daily Sales */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              1. Daily Food Sales
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {sales?.ordersCount || 0} customer orders
            </p>
          </div>
        </div>

        {/* 2. Total Supplies Cost */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              2. Supplies Cost
            </span>
            <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-100">
              {formatCurrency(totalSuppliesCost)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {supplies?.entriesCount || 0} batches delivered
            </p>
          </div>
        </div>

        {/* 3. Cash Paid to Suppliers */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              3. Cash Handed Out
            </span>
            <div className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-sky-400">
              {formatCurrency(totalCashPaidOut)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Paid to suppliers today
            </p>
          </div>
        </div>

        {/* 4. Left to Pay (Udhaar) */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              4. Left to Pay (ادھار)
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black ${totalPendingUdhaar > 0 ? "text-amber-400" : "text-slate-400"}`}>
              {formatCurrency(totalPendingUdhaar)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalPendingUdhaar > 0 ? "Pending supplier balances" : "All cleared today"}
            </p>
          </div>
        </div>

        {/* 5. Net Cash Flow */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              5. Day Cash Balance
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${netCashFlow >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              {netCashFlow >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black ${netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(netCashFlow)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Sales Cash - Supplies Cash
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Generating daily business register...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: FOOD ITEMS SOLD TODAY */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-100">
                    Which Things Got Sold Today (Food Sales Register)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Breakdown of items ordered by customers on this day
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {sales?.itemsSold.length || 0} items sold
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4"># Rank</th>
                    <th className="py-3 px-4">Food Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Quantity Sold</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                    <th className="py-3 px-4 text-right">Sales Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(!sales?.itemsSold || sales.itemsSold.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No food sales recorded for this date yet.
                      </td>
                    </tr>
                  ) : (
                    sales.itemsSold.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-100">
                          {it.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {it.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                            {it.quantitySold} ordered
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-100 text-sm">
                          {formatCurrency(it.totalRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-medium">
                          {it.percentageOfSales}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {sales && sales.itemsSold.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-700 bg-slate-800/40 text-xs font-bold text-slate-200">
                      <td colSpan={3} className="py-3 px-4 uppercase">
                        Total Food Sales:
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-400">
                        {sales.itemsSold.reduce((s, it) => s + it.quantitySold, 0)} items
                      </td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-right text-emerald-400 text-sm font-black">
                        {formatCurrency(totalSales)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* SECTION 2: SUPPLIES BROUGHT TODAY */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Package className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-100">
                    Which Were Brought From Whom (Daily Supplies Arrived)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Daily raw materials brought by local vendors (Ahmed, Ali, Tariq, Babar, City Bakers...)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {supplies?.supplies.length || 0} delivery batches
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Person (Brought From)</th>
                    <th className="py-3 px-4">Thing / Item Bought</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-right">Price / Money (PKR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(!supplies?.supplies || supplies.supplies.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No supplies recorded for this date.
                      </td>
                    </tr>
                  ) : (
                    supplies.supplies.map((s) => {
                      const isPending = s.paymentStatus === "PENDING";
                      const timeStr = new Date(s.date || s.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-mono">{timeStr}</td>
                          <td className="py-3 px-4 font-bold text-slate-100">
                            <span className="text-orange-400 font-black mr-1">•</span>
                            {s.personName}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {s.itemName}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <span className="font-bold">{s.quantity}</span> {s.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-100 text-sm">
                            {formatCurrency(s.totalCost)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pending (Left to pay)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Paid (Cash)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right print:hidden">
                            {isPending && (
                              <button
                                onClick={() =>
                                  setSettleModalState({
                                    isOpen: true,
                                    supplyId: s.id,
                                    personName: s.personName,
                                    itemName: s.itemName,
                                    pendingAmount: s.totalCost,
                                  })
                                }
                                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                              >
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {supplies && supplies.supplies.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-700 bg-slate-800/40 text-xs font-bold text-slate-200">
                      <td colSpan={4} className="py-3 px-4 uppercase">
                        Total Supplies Cost:
                      </td>
                      <td className="py-3 px-4 text-right text-orange-400 text-sm font-black">
                        {formatCurrency(totalSuppliesCost)}
                      </td>
                      <td className="py-3 px-4 text-center text-[11px]">
                        Paid: {formatCurrency(totalCashPaidOut)} | Left:{" "}
                        <span className="text-amber-400">{formatCurrency(totalPendingUdhaar)}</span>
                      </td>
                      <td className="py-3 px-4 print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* SECTION 3: VENDOR SETTLEMENT SUMMARY (WHO WERE PAID & WHO ARE LEFT) */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <UserCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-100">
                    Who Were Paid and Who Are Left (Vendor Khata Balance)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Summary of payments made today and remaining pending balances for each person
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {vendors.length} vendors active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Vendor / Person Name</th>
                    <th className="py-3 px-4 text-center">Deliveries Today</th>
                    <th className="py-3 px-4 text-right">Total Billed Today</th>
                    <th className="py-3 px-4 text-right">Paid Today (PKR)</th>
                    <th className="py-3 px-4 text-right">Left Unpaid Today</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right print:hidden">Settle Khata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No vendor deliveries recorded on this date.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((v) => {
                      const isLeft = v.pendingAmount > 0;
                      return (
                        <tr key={v.personName} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-100 text-sm">
                            {v.personName}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                              {v.itemsCount} batch{v.itemsCount > 1 ? "es" : ""}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                            {formatCurrency(v.totalSuppliesCost)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                            {formatCurrency(v.paidAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-sm">
                            <span className={isLeft ? "text-amber-400" : "text-slate-400"}>
                              {formatCurrency(v.pendingAmount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isLeft ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Balance Left
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                Fully Cleared
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right print:hidden">
                            {isLeft ? (
                              <button
                                onClick={() =>
                                  setSettleModalState({
                                    isOpen: true,
                                    personName: v.personName,
                                    pendingAmount: v.pendingAmount,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                              >
                                Pay {v.personName}
                              </button>
                            ) : (
                              <span className="text-slate-500 text-xs italic">Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      <SettlePaymentModal
        isOpen={settleModalState.isOpen}
        onClose={() =>
          setSettleModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["daily-log"] });
          queryClient.invalidateQueries({ queryKey: ["supplies"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }}
        supplyId={settleModalState.supplyId}
        personName={settleModalState.personName}
        itemName={settleModalState.itemName}
        pendingAmount={settleModalState.pendingAmount}
      />
    </div>
  );
}
