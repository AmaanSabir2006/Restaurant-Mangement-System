"use client";

import React, { useState } from "react";
import { IngredientDto, StockTransactionType } from "@/lib/types";
import { X, AlertOctagon, Plus, Check } from "lucide-react";

interface AdjustmentModalProps {
  ingredient: IngredientDto | null;
  onClose: () => void;
  onSubmit: (data: {
    ingredientId: string;
    type: "WASTE" | "ADJUSTMENT" | "RESTOCK";
    quantity: number;
    reason: string;
  }) => void;
  isSubmitting: boolean;
}

export default function AdjustmentModal({
  ingredient,
  onClose,
  onSubmit,
  isSubmitting,
}: AdjustmentModalProps) {
  const [type, setType] = useState<"WASTE" | "ADJUSTMENT" | "RESTOCK">("WASTE");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  if (!ingredient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (!qtyNum || qtyNum <= 0) {
      alert("Please enter a valid quantity greater than zero");
      return;
    }
    if (!reason.trim()) {
      alert("Please provide an audit reason for the adjustment");
      return;
    }

    onSubmit({
      ingredientId: ingredient.id,
      type,
      quantity: qtyNum,
      reason: reason.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Stock Adjustment & Waste</h3>
              <p className="text-xs text-slate-400">Log audit trail transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Ingredient Info */}
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Selected Item:</span>
              <h4 className="font-bold text-white text-sm">{ingredient.name}</h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Current Stock:</span>
              <div className="text-sm font-black text-orange-400">
                {ingredient.currentStock} {ingredient.unit}
              </div>
            </div>
          </div>

          {/* Adjustment Type Radio */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Transaction Reason / Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("WASTE")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                  type === "WASTE"
                    ? "bg-red-500/20 text-red-300 border-red-500 shadow-sm"
                    : "bg-slate-800/70 text-slate-400 border-slate-700"
                }`}
              >
                Waste / Spoiled
              </button>
              <button
                type="button"
                onClick={() => setType("ADJUSTMENT")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                  type === "ADJUSTMENT"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm"
                    : "bg-slate-800/70 text-slate-400 border-slate-700"
                }`}
              >
                Count Delta
              </button>
              <button
                type="button"
                onClick={() => setType("RESTOCK")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                  type === "RESTOCK"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm"
                    : "bg-slate-800/70 text-slate-400 border-slate-700"
                }`}
              >
                Manual Add
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Quantity ({ingredient.unit})
            </label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter amount in ${ingredient.unit}`}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              autoFocus
            />
          </div>

          {/* Reason notes */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Audit Reason & Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Dropped on prep floor, expired batch #49, physical count correction"
              rows={2}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              required
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Log Transaction"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
