"use client";

import React, { useState } from "react";
import { X, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { soundManager } from "@/lib/sound";

interface ResetAnalyticsMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  monthKey: string;
  monthLabel: string;
  monthSales: number;
  monthOrdersCount: number;
  monthSuppliesCost?: number;
  isMonthReset?: boolean;
}

export default function ResetAnalyticsMonthModal({
  isOpen,
  onClose,
  onSuccess,
  monthKey,
  monthLabel,
  monthSales,
  monthOrdersCount,
  monthSuppliesCost = 0,
  isMonthReset = false,
}: ResetAnalyticsMonthModalProps) {
  const [resetSupplies, setResetSupplies] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (action: "reset" | "restore" | "start_fresh") => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/analytics/reset-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey,
          action,
          notes: notes.trim() || undefined,
          resetSupplies,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process request");
      }

      soundManager.playSuccessTone();
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isMonthReset ? "Start Fresh / Monthly Archive" : "Reset Month & Start Fresh"}
              </h2>
              <p className="text-[11px] text-slate-400">
                Set all sales &amp; orders counters to Rs. 0 for a clean fresh start
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Month Summary Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Period:</span>
              <span className="font-bold text-slate-200">{monthLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Food Sales:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatCurrency(monthSales)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Customer Orders:</span>
              <span className="font-bold text-slate-200">{monthOrdersCount} orders</span>
            </div>
            {monthSuppliesCost > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                <span className="text-slate-400">Supplies Expense:</span>
                <span className="font-bold text-orange-400">
                  {formatCurrency(monthSuppliesCost)}
                </span>
              </div>
            )}
          </div>

          {/* Explanation Alert */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
            <div>
              <p className="font-bold">What happens when you Start Fresh?</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Today&apos;s Total Sales, Month Sales, and Supplies Khata will reset to <strong>Rs. 0</strong> so you can begin billing from a clean slate.
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 inline" />
                Previous records are safely preserved in the archive.
              </p>
            </div>
          </div>

          {/* Also reset supplies checkbox */}
          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={resetSupplies}
              onChange={(e) => setResetSupplies(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
            />
            <span>Also reset &amp; archive daily supplies Khata to Rs. 0</span>
          </label>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">
              Notes / Reason (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Month day-end reset, fresh start"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60">
          <div>
            {isMonthReset && (
              <button
                type="button"
                onClick={() => handleAction("restore")}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Restore Archived Month
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleAction("start_fresh")}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Resetting to 0...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Make All Zero (Rs. 0)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
