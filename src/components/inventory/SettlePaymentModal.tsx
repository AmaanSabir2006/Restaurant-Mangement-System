"use client";

import React, { useState } from "react";
import { X, CheckCircle2, DollarSign, CreditCard, Smartphone, Banknote, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { soundManager } from "@/lib/sound";

interface SettlePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplyId?: string;
  personName: string;
  itemName?: string;
  pendingAmount: number;
}

export default function SettlePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  supplyId,
  personName,
  itemName,
  pendingAmount,
}: SettlePaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "EASYPAISA_JAZZCASH" | "BANK_TRANSFER">("CASH");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/supplies/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplyId,
          personName,
          paymentMethod,
          settlementNotes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to settle payment");
      }

      soundManager.playSuccessTone();
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to settle payment");
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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Settle Vendor Payment (Khata)</h2>
              <p className="text-[11px] text-slate-400">Pay pending balance to {personName}</p>
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
        <form onSubmit={handleSettle} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Pending Details Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Supplier / Person:</span>
              <span className="font-bold text-slate-100 text-sm">{personName}</span>
            </div>
            {itemName && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Item Bought:</span>
                <span className="font-semibold text-slate-200">{itemName}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
              <span className="text-slate-400">Pending Udhaar Amount:</span>
              <span className="font-black text-amber-400 text-base">
                {formatCurrency(pendingAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-sm"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                <Banknote className="w-4 h-4 mb-1 text-emerald-400" />
                <span>Cash (نقدی)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("EASYPAISA_JAZZCASH")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                  paymentMethod === "EASYPAISA_JAZZCASH"
                    ? "bg-orange-600/20 text-orange-300 border-orange-500 shadow-sm"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-4 h-4 mb-1 text-orange-400" />
                <span>JazzCash/EP</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1 text-blue-400" />
                <span>Bank / Online</span>
              </button>
            </div>
          </div>

          {/* Settlement Remarks / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment Remarks / Proof (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed cash in evening / Transaction ID"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Paid ({formatCurrency(pendingAmount)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
