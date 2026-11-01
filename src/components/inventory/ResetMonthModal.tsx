"use client";

import React, { useState } from "react";
import { X, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { soundManager } from "@/lib/sound";

interface ResetMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  monthKey: string;
  monthLabel: string;
  currentTotal: number;
  entriesCount: number;
}

export default function ResetMonthModal({
  isOpen,
  onClose,
  onSuccess,
  monthKey,
  monthLabel,
  currentTotal,
  entriesCount,
}: ResetMonthModalProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/supplies/reset-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey,
          action: "reset",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to reset month total");
      }

      soundManager.playSuccessTone();
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset month");
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
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Reset Monthly Total</h2>
              <p className="text-[11px] text-slate-400">Start new month cycle at Rs. 0</p>
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

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Selected Month:</span>
              <span className="font-bold text-slate-200">{monthLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Spend Total:</span>
              <span className="font-bold text-orange-400 text-sm">
                {formatCurrency(currentTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Recorded Deliveries:</span>
              <span className="font-bold text-slate-200">{entriesCount} entries</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">What happens when you reset?</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                The running total for <strong>{monthLabel}</strong> will reset back to{" "}
                <strong>Rs. 0</strong> so you can start recording the new month cleanly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>All past entries remain safely saved in the monthly history archives.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-900/60">
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
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Total to Rs. 0</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
