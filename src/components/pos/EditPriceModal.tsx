"use client";

import React, { useState, useEffect } from "react";
import { MenuItemDto, ItemSizeOption } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { soundManager } from "@/lib/sound";
import { X, Tag, Check, ArrowRight, Sparkles } from "lucide-react";

interface EditPriceModalProps {
  item: MenuItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  onPriceUpdated?: () => void;
}

export default function EditPriceModal({
  item,
  isOpen,
  onClose,
  onPriceUpdated,
}: EditPriceModalProps) {
  const [basePrice, setBasePrice] = useState<number>(0);
  const [sizes, setSizes] = useState<ItemSizeOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setBasePrice(item.price);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Parse sizes if available
      let parsedSizes: ItemSizeOption[] = [];
      if (item.sizeOptions && item.sizeOptions.length > 0) {
        parsedSizes = item.sizeOptions;
      } else if (item.sizes) {
        try {
          const parsed = JSON.parse(item.sizes);
          if (Array.isArray(parsed)) parsedSizes = parsed;
        } catch {
          parsedSizes = [];
        }
      }
      setSizes(parsedSizes);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const hasSizes = sizes.length > 0;

  const handleSizePriceChange = (index: number, newPrice: number) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], price: Math.max(0, newPrice) };
    setSizes(updated);
  };

  const handleQuickAdjust = (delta: number) => {
    setBasePrice((prev) => Math.max(0, prev + delta));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      let payload: any = { id: item.id };

      if (hasSizes) {
        // Validate sizes
        for (const s of sizes) {
          if (s.price <= 0) {
            throw new Error(`Price for size "${s.name}" must be greater than 0`);
          }
        }
        const minPrice = Math.min(...sizes.map((s) => s.price));
        payload.sizes = sizes;
        payload.price = minPrice;
      } else {
        if (basePrice <= 0) {
          throw new Error("Product price must be greater than 0");
        }
        payload.price = Number(basePrice);
      }

      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update price");
      }

      soundManager.playSuccessTone();
      setSuccessMsg("Price successfully updated!");
      setTimeout(() => {
        onPriceUpdated?.();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save price");
      soundManager.playErrorTone();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Edit Product Price</h3>
              <p className="text-xs text-slate-400 font-mono">
                {item.sku} • {item.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          {/* Item Name Banner */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <span className="font-extrabold text-slate-100 text-sm">{item.name}</span>
            <span className="text-xs font-black text-blue-400 font-mono">Current: {formatCurrency(item.price)}</span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {hasSizes ? (
            /* Multi-Size Price Inputs */
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Prices per Size / Variant:
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sizes.map((size, idx) => (
                  <div
                    key={size.name}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-800 border border-slate-700"
                  >
                    <span className="font-bold text-xs text-slate-200 min-w-[70px]">
                      {size.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-1 max-w-[180px]">
                      <span className="text-xs text-slate-400 font-bold">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={size.price}
                        onChange={(e) => handleSizePriceChange(idx, Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single Base Price Input */
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                New Price (Rs.):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-base text-slate-100 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Quick Adjust Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "-10", delta: -10 },
                  { label: "+10", delta: 10 },
                  { label: "+20", delta: 20 },
                  { label: "+50", delta: 50 },
                  { label: "+100", delta: 100 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => handleQuickAdjust(btn.delta)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 italic">
            Updating the price will immediately take effect on all new customer tickets and receipts.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Update Price"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
