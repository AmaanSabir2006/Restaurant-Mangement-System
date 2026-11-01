"use client";

import React, { useState, useEffect } from "react";
import { PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { soundManager } from "@/lib/sound";
import { useLanguage } from "@/lib/LanguageContext";
import confetti from "canvas-confetti";
import {
  X,
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

interface PaymentModalProps {
  totalAmount: number;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: PaymentMethod, tenderAmount: number, change: number) => void;
  isSubmitting: boolean;
}

export default function PaymentModal({
  totalAmount,
  onClose,
  onConfirmPayment,
  isSubmitting,
}: PaymentModalProps) {
  const { t, isUrdu } = useLanguage();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [tenderAmountStr, setTenderAmountStr] = useState<string>(totalAmount.toFixed(2));
  const [cardProcessingState, setCardProcessingState] = useState<"idle" | "authorizing" | "approved">("idle");

  const tenderAmount = parseFloat(tenderAmountStr) || 0;
  const change = Math.max(0, tenderAmount - totalAmount);
  const isSufficient = method !== "CASH" || tenderAmount >= totalAmount - 0.001;

  // Preset quick cash denominations in PKR
  const quickBills = [
    { label: "Exact", value: totalAmount },
    { label: "Rs. 500", value: 500 },
    { label: "Rs. 1,000", value: 1000 },
    { label: "Rs. 2,000", value: 2000 },
    { label: "Rs. 5,000", value: 5000 },
  ].filter((b) => b.label === "Exact" || b.value >= totalAmount);

  const handlePay = () => {
    if (!isSufficient) return;

    if (method === "CARD") {
      setCardProcessingState("authorizing");
      setTimeout(() => {
        setCardProcessingState("approved");
        soundManager.playSuccessTone();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        setTimeout(() => {
          onConfirmPayment("CARD", totalAmount, 0);
        }, 600);
      }, 1200);
      return;
    }

    soundManager.playSuccessTone();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    onConfirmPayment(method, tenderAmount, change);
  };

  // Keyboard shortcut Enter to pay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isSufficient && !isSubmitting) {
        handlePay();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tenderAmount, method, isSufficient, isSubmitting]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">{t("Tender & Payment")}</h3>
              <p className="text-xs text-slate-400">{t("Select payment method & complete sale")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="p-5 bg-slate-900 border-b border-slate-700 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {t("Total Due")}
          </span>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight mt-1">
            {formatCurrency(totalAmount)}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMethod("CASH");
                setTenderAmountStr(totalAmount.toFixed(2));
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                method === "CASH"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60 hover:text-slate-100"
              }`}
            >
              <Banknote className="w-5 h-5 mb-1.5" />
              <span>{t("Cash")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod("CARD");
                setTenderAmountStr(totalAmount.toFixed(2));
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                method === "CARD"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60 hover:text-slate-100"
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1.5" />
              <span>{t("Card / EMV")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod("QR_MOBILE");
                setTenderAmountStr(totalAmount.toFixed(2));
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                method === "QR_MOBILE"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60 hover:text-slate-100"
              }`}
            >
              <QrCode className="w-5 h-5 mb-1.5" />
              <span>{t("Mobile / QR")}</span>
            </button>
          </div>

          {/* CASH Panel */}
          {method === "CASH" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  {t("Amount Tendered (PKR)")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={tenderAmountStr}
                    onChange={(e) => setTenderAmountStr(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-lg font-black text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick tender buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  {t("Quick Tender Presets")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickBills.map((bill) => (
                    <button
                      key={bill.label}
                      type="button"
                      onClick={() => setTenderAmountStr(bill.value.toFixed(2))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      {bill.label === "Exact" ? `${t("Exact")} (${formatCurrency(bill.value)})` : bill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Display Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  change > 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                    : tenderAmount < totalAmount
                    ? "bg-red-500/10 border-red-500/30 text-red-500 font-bold"
                    : "bg-slate-800 border border-slate-700 text-slate-300 font-medium"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{t("Change to Return:")}</span>
                  <span className="text-xl font-black">
                    {tenderAmount >= totalAmount ? formatCurrency(change) : t("Insufficient Cash")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CARD Panel */}
          {method === "CARD" && (
            <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center border border-blue-500/30">
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {cardProcessingState === "authorizing"
                    ? "Contacting Bank Gateway..."
                    : cardProcessingState === "approved"
                    ? "Payment Approved!"
                    : "Ready for Customer Card"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Insert chip, tap NFC contactless card, or swipe to pay {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>PCI-DSS Compliant End-to-End Encryption</span>
              </div>
            </div>
          )}

          {/* QR / MOBILE Panel */}
          {method === "QR_MOBILE" && (
            <div className="p-5 rounded-xl bg-slate-800 border border-slate-700 text-center space-y-3">
              <div className="w-32 h-32 mx-auto p-2 bg-white rounded-xl shadow-md flex items-center justify-center">
                {/* Simulated high-contrast QR matrix pattern */}
                <div className="w-full h-full border-4 border-slate-900 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 bg-slate-950 rounded-sm" />
                    <div className="w-6 h-6 bg-slate-950 rounded-sm" />
                  </div>
                  <div className="flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-orange-600 animate-bounce" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 bg-slate-950 rounded-sm" />
                    <div className="w-4 h-4 bg-slate-950 rounded-sm" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Scan to Pay</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  EasyPaisa, JazzCash, Nayapay, or SadaPay
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={!isSufficient || isSubmitting || cardProcessingState === "authorizing"}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting || cardProcessingState === "authorizing" ? (
              <span>{t("Authorizing...")}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t("Complete Sale")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
