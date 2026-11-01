"use client";

import React from "react";
import { X, AlertTriangle, PackageOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  supplier?: string | null;
  costPerUnit?: number;
  status: "LOW" | "OUT_OF_STOCK";
}

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LowStockItem[];
}

export default function LowStockModal({
  isOpen,
  onClose,
  items,
}: LowStockModalProps) {
  const { t, isUrdu } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  {t("Items Running Low")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-500/15 border border-red-500/30 text-red-400">
                  {items.length} {items.length === 1 ? t("Item") : t("Items")} {t("Alert")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t("Ingredients and inventory reaching or below safety reorder levels")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-base">
                  {t("All Stock is Healthy!")}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {t("No ingredients or supplies are currently running low. All items are above their minimum safety thresholds.")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Alert notice */}
              <div className="p-3.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>
                  {t("The following items have fallen to or below the minimum reorder threshold and should be restocked soon.")}
                </span>
              </div>

              {/* Items List Table / Cards */}
              <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3.5">{t("Item Name")}</th>
                      <th className="py-2.5 px-3">{t("Current Stock")}</th>
                      <th className="py-2.5 px-3">{t("Safety Min.")}</th>
                      <th className="py-2.5 px-3">{t("Supplier")}</th>
                      <th className="py-2.5 px-3 text-right">{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {items.map((item) => {
                      const isOutOfStock = item.currentStock <= 0;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-100">
                              {t(item.name)}
                            </div>
                            {item.costPerUnit ? (
                              <div className="text-[10px] text-slate-400">
                                Approx. Rs. {item.costPerUnit} / {item.unit}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded-md ${
                                isOutOfStock
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                                  : "bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono font-bold">
                            {item.reorderThreshold} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {item.supplier || "—"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                                isOutOfStock
                                  ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40"
                                  : "bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {isOutOfStock ? t("OUT OF STOCK") : t("LOW STOCK")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
