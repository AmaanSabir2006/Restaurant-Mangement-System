"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DailySupplyDto, MonthlySuppliesAnalyticsDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { soundManager } from "@/lib/sound";
import { useLanguage } from "@/lib/LanguageContext";
import AddSupplyModal from "./AddSupplyModal";
import ResetMonthModal from "./ResetMonthModal";
import SettlePaymentModal from "./SettlePaymentModal";
import DailyBusinessLogView from "./DailyBusinessLogView";
import {
  Wallet,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  DollarSign,
  UserCheck,
  CreditCard,
  FileText,
} from "lucide-react";

export default function InventoryManagement() {
  const queryClient = useQueryClient();
  const { t, isUrdu } = useLanguage();

  // Current month default (e.g. "2026-11")
  const today = new Date();
  const defaultMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthKey);
  const [activeTab, setActiveTab] = useState<"daily-log" | "ledger" | "khata" | "analytics">("ledger");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Settle Payment Modal State
  const [settleModal, setSettleModal] = useState<{
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

  // Fetch Daily Supplies & Analytics from API
  const { data, isLoading } = useQuery<{
    success: boolean;
    monthKey: string;
    monthLabel: string;
    totalCost: number;
    totalPaid: number;
    totalPending: number;
    totalEntries: number;
    supplies: DailySupplyDto[];
    byPerson: MonthlySuppliesAnalyticsDto["byPerson"];
    byItem: MonthlySuppliesAnalyticsDto["byItem"];
    availableMonths: MonthlySuppliesAnalyticsDto["availableMonths"];
  }>({
    queryKey: ["supplies", selectedMonth, paymentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMonth) params.set("month", selectedMonth);
      if (paymentFilter !== "ALL") params.set("status", paymentFilter);
      const res = await fetch(`/api/supplies?${params.toString()}`);
      return res.json();
    },
    refetchInterval: 10000,
  });

  const supplies = data?.supplies || [];
  const byPerson = data?.byPerson || [];
  const byItem = data?.byItem || [];
  const availableMonths = data?.availableMonths || [];
  const totalCost = data?.totalCost || 0;
  const totalPaid = data?.totalPaid || 0;
  const totalPending = data?.totalPending || 0;
  const totalEntries = data?.totalEntries || 0;
  const monthLabel = data?.monthLabel || "Current Month";

  // Pending supplies list for Khata
  const pendingSupplies = supplies.filter((s) => s.paymentStatus === "PENDING");
  const vendorsWithPending = byPerson.filter((p) => p.pendingAmount > 0);

  // Client-side search filtering
  const filteredSupplies = supplies.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.personName.toLowerCase().includes(q) ||
      s.itemName.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q))
    );
  });

  // Toggle Payment Status Mutation (Mark as Paid / Pending)
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: "PAID" | "PENDING" }) => {
      const res = await fetch("/api/supplies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paymentStatus: newStatus }),
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);
      return resData;
    },
    onSuccess: () => {
      soundManager.playSuccessTone();
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  // Delete Supply Mutation
  const deleteSupplyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/supplies?id=${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);
      return resData;
    },
    onSuccess: () => {
      soundManager.playClick();
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });

  const handleDelete = (id: string, personName: string, itemName: string) => {
    if (confirm(`Delete entry: ${personName} - ${itemName}?`)) {
      deleteSupplyMutation.mutate(id);
    }
  };

  const existingPersonNames = Array.from(new Set(supplies.map((s) => s.personName)));
  const existingItemNames = Array.from(new Set(supplies.map((s) => s.itemName)));

  // Color generator for vendor initials avatar
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "bg-rose-500/20 text-rose-400 border-rose-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-950 space-y-5">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <Wallet className="w-5 h-5" />
              </span>
              <span>{t("Daily Supplies Ledger & Khata")}</span>
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Khata
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t("Record daily grocery, meat, dairy & vendor expenses with instant Khata tracking.")}
          </p>
        </div>

        {/* Action Controls: Month selector, Reset Month, Record Purchase */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Month Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl pl-8 pr-8 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm transition-all"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.count} items)
                </option>
              ))}
              <option value="ALL">All Time History</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Monthly Total Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Reset monthly spend counter to Rs. 0 for a new month"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">{t("Reset Month Total")}</span>
            <span className="sm:hidden">Reset</span>
          </button>

          {/* + Record New Purchase / Supply */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t("Add New Supply")}</span>
          </button>
        </div>
      </div>

      {/* 4 Monthly Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Monthly Total Expense */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Month Total Supplies")} ({monthLabel.split(" ")[0]})
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              {formatCurrency(totalCost)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Total supplies cost recorded for this month
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-orange-500/5 rounded-full pointer-events-none" />
        </div>

        {/* 2. Total Cash Paid */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Paid Amount")}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalCost > 0 ? `${Math.round((totalPaid / totalCost) * 100)}% of total paid` : "No purchases"}
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>

        {/* 3. Pending / Udhaar Balance */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Remaining Udhaar")}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${totalPending > 0 ? "text-amber-400" : "text-slate-400"}`}>
              {formatCurrency(totalPending)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {vendorsWithPending.length > 0 ? `${vendorsWithPending.length} vendors with pending balance` : "All suppliers fully cleared"}
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>

        {/* 4. Total Purchases / Deliveries */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Deliveries
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              {totalEntries} <span className="text-sm font-normal text-slate-400">entries</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {byPerson.length} unique suppliers recorded
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-sky-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Main Feature Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-700/80">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "ledger"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{t("Ledger Records")} ({filteredSupplies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("khata")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "khata"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t("Person Khata (ادھار)")}</span>
            {vendorsWithPending.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {vendorsWithPending.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("daily-log")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "daily-log"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t("Daily Log (روزنامچہ)")}</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t("Monthly Analytics")}</span>
          </button>
        </div>

        {/* Filter & Search Bar for Ledger */}
        {activeTab === "ledger" && (
          <div className="flex items-center gap-2">
            {/* Payment Status Filter */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">
              <button
                onClick={() => setPaymentFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  paymentFilter === "ALL"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPaymentFilter("PAID")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  paymentFilter === "PAID"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setPaymentFilter("PENDING")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  paymentFilter === "PENDING"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Pending
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search person or item..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading supply ledger and monthly analytics...</span>
        </div>
      ) : activeTab === "daily-log" ? (
        /* TAB: DAILY BUSINESS LOGS (ROZNAMCHA) */
        <DailyBusinessLogView />
      ) : activeTab === "khata" ? (
        /* TAB: VENDOR KHATA & PAY LATER SECTION */
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>Vendor Khata &amp; Udhaar Ledger (ادھار کھاتہ)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Track pending items, settle payments later via Cash or Online, and keep accounts clear.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Pending Udhaar</span>
              <span className="text-xl font-black text-amber-400">{formatCurrency(totalPending)}</span>
            </div>
          </div>

          {/* Vendors with Pending Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {vendorsWithPending.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-200">No Pending Udhaar!</h4>
                <p className="text-xs text-slate-500">All suppliers and delivery persons are fully paid.</p>
              </div>
            ) : (
              vendorsWithPending.map((v) => {
                const vendorPendingItems = pendingSupplies.filter((s) => s.personName === v.personName);

                return (
                  <div
                    key={v.personName}
                    className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm uppercase shrink-0 ${getAvatarColor(
                              v.personName
                            )}`}
                          >
                            {v.personName.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-100 text-sm">{v.personName}</h4>
                            <span className="text-[11px] text-amber-400 font-semibold">
                              {vendorPendingItems.length} pending supply item{vendorPendingItems.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {formatCurrency(v.pendingAmount)}
                        </span>
                      </div>

                      {/* List of pending items from this vendor */}
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                        {vendorPendingItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60"
                          >
                            <div>
                              <span className="font-bold text-slate-200 block">{item.itemName}</span>
                              <span className="text-[10px] text-slate-400">
                                {item.quantity} {item.unit} • {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-amber-300 block">{formatCurrency(item.totalCost)}</span>
                              <button
                                onClick={() =>
                                  setSettleModal({
                                    isOpen: true,
                                    supplyId: item.id,
                                    personName: item.personName,
                                    itemName: item.itemName,
                                    pendingAmount: item.totalCost,
                                  })
                                }
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                              >
                                Settle Item
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settle All for this Vendor Button */}
                    <button
                      onClick={() =>
                        setSettleModal({
                          isOpen: true,
                          personName: v.personName,
                          pendingAmount: v.pendingAmount,
                        })
                      }
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Settle All with {v.personName} ({formatCurrency(v.pendingAmount)})</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : activeTab === "ledger" ? (
        /* TAB: DAILY PURCHASES LEDGER TABLE */
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
          {filteredSupplies.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">No purchase records found for this filter</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click &quot;+ Record Purchase&quot; to write the person name, item bought, and price given.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                + Record First Purchase
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Person (Who Brought)</th>
                    <th className="py-3 px-4">Thing / Item Bought</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-right">Money Given (PKR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredSupplies.map((entry) => {
                    const isPending = entry.paymentStatus === "PENDING";
                    const entryDate = new Date(entry.date || entry.createdAt);
                    const formattedDate = entryDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    const formattedTime = entryDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-850/60 transition-colors group"
                      >
                        {/* Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                          <div className="font-semibold">{formattedDate}</div>
                          <div className="text-[11px] text-slate-400">{formattedTime}</div>
                        </td>

                        {/* Person Name */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs uppercase shrink-0 ${getAvatarColor(
                                entry.personName
                              )}`}
                            >
                              {entry.personName.slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-100 text-sm">
                                {entry.personName}
                              </span>
                              {entry.notes && (
                                <p className="text-[11px] text-slate-400 max-w-xs truncate">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Item Bought */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-200">
                            {entry.itemName}
                          </span>
                        </td>

                        {/* Quantity & Unit */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                          <span className="font-bold">{entry.quantity}</span>{" "}
                          <span className="text-slate-400">{entry.unit}</span>
                        </td>

                        {/* Price / Money Given */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="font-black text-sm text-slate-100">
                            {formatCurrency(entry.totalCost)}
                          </span>
                        </td>

                        {/* Payment Status with 1-Click Toggle or Settle */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          {isPending ? (
                            <button
                              onClick={() =>
                                setSettleModal({
                                  isOpen: true,
                                  supplyId: entry.id,
                                  personName: entry.personName,
                                  itemName: entry.itemName,
                                  pendingAmount: entry.totalCost,
                                })
                              }
                              title="Click to Pay / Settle this item"
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Pending (Pay Later)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                togglePaymentMutation.mutate({
                                  id: entry.id,
                                  newStatus: "PENDING",
                                })
                              }
                              title="Click to toggle to Pending"
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-amber-500/20 hover:text-amber-300 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Paid (Cash)</span>
                            </button>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() =>
                              handleDelete(entry.id, entry.personName, entry.itemName)
                            }
                            title="Delete entry"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB: MONTHLY ANALYTICS (PERSON TOTALS & ITEM BREAKDOWN) */
        <div className="space-y-6">
          {/* Person Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold text-slate-200 text-sm">
                Supplier Spend Breakdown ({byPerson.length} persons)
              </span>
              <span>Sorted by highest expense</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {byPerson.map((p) => {
                const percentage = totalCost > 0 ? Math.round((p.totalCost / totalCost) * 100) : 0;
                return (
                  <div
                    key={p.personName}
                    className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-600 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm uppercase shrink-0 ${getAvatarColor(
                              p.personName
                            )}`}
                          >
                            {p.personName.slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-100 text-sm">{p.personName}</h3>
                            <span className="text-[11px] text-slate-400">
                              {p.count} delivery batch{p.count > 1 ? "es" : ""}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                          {percentage}% share
                        </span>
                      </div>

                      {/* Spend Amounts */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">Total Money Given:</span>
                          <span className="text-base font-black text-slate-100">
                            {formatCurrency(p.totalCost)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Paid Amount:</span>
                          <span className="text-emerald-400 font-bold">
                            {formatCurrency(p.paidAmount)}
                          </span>
                        </div>

                        {p.pendingAmount > 0 && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-amber-400 font-medium">Pending Udhaar:</span>
                            <span className="text-amber-400 font-bold">
                              {formatCurrency(p.pendingAmount)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-orange-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSearchFilter(p.personName);
                        setActiveTab("ledger");
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View {p.personName}&apos;s Deliveries</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Item Breakdown */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold text-slate-200 text-sm">
                Item Cost Breakdown ({byItem.length} items)
              </span>
              <span>Sorted by highest spend</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {byItem.map((item) => {
                const percentage = totalCost > 0 ? Math.round((item.totalCost / totalCost) * 100) : 0;
                return (
                  <div
                    key={item.itemName}
                    className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-600 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="font-bold text-slate-100 text-sm line-clamp-1">
                              {item.itemName}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              {item.count} purchase{item.count > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {percentage}% cost
                        </span>
                      </div>

                      {/* Quantity & Spend */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">Total Money Spent:</span>
                          <span className="text-base font-black text-slate-100">
                            {formatCurrency(item.totalCost)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Total Quantity Received:</span>
                          <span className="text-slate-200 font-bold">
                            {item.totalQuantity} {item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSearchFilter(item.itemName);
                        setActiveTab("ledger");
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View {item.itemName} Purchases</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      <AddSupplyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["supplies"] });
          queryClient.invalidateQueries({ queryKey: ["daily-log"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }}
        existingPersons={existingPersonNames}
        existingItems={existingItemNames}
      />

      {/* Reset Month Modal */}
      <ResetMonthModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["supplies"] });
          queryClient.invalidateQueries({ queryKey: ["daily-log"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }}
        monthKey={selectedMonth}
        monthLabel={monthLabel}
        currentTotal={totalCost}
        entriesCount={totalEntries}
      />

      {/* Settle Payment Modal */}
      <SettlePaymentModal
        isOpen={settleModal.isOpen}
        onClose={() =>
          setSettleModal((prev) => ({ ...prev, isOpen: false }))
        }
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["supplies"] });
          queryClient.invalidateQueries({ queryKey: ["daily-log"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }}
        supplyId={settleModal.supplyId}
        personName={settleModal.personName}
        itemName={settleModal.itemName}
        pendingAmount={settleModal.pendingAmount}
      />
    </div>
  );
}
