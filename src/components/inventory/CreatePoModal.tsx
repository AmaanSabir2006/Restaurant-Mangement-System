"use client";

import React, { useState } from "react";
import { IngredientDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Plus, Trash2, Check, ShoppingCart } from "lucide-react";

interface CreatePoModalProps {
  ingredients: IngredientDto[];
  onClose: () => void;
  onSubmit: (data: {
    supplier: string;
    notes?: string;
    items: { ingredientId: string; quantity: number; unitCost: number }[];
  }) => void;
  isSubmitting: boolean;
}

export default function CreatePoModal({
  ingredients,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePoModalProps) {
  const [supplier, setSupplier] = useState<string>("Golden Crust Bakery");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<
    { ingredientId: string; quantity: number; unitCost: number }[]
  >([
    {
      ingredientId: ingredients[0]?.id || "",
      quantity: 50,
      unitCost: ingredients[0]?.costPerUnit || 0.5,
    },
  ]);

  const suppliersList = [
    "Golden Crust Bakery",
    "Apex Meats Wholesale",
    "Poultry Farms Inc.",
    "DairyGold Creamery",
    "Valley Greens Produce",
    "FarmCrisp Frozen",
    "Metro Beverage Distribution",
    "EcoPack Solutions",
  ];

  const addItemRow = () => {
    const unselected = ingredients.find(
      (ing) => !items.some((i) => i.ingredientId === ing.id)
    );
    const chosen = unselected || ingredients[0];
    if (chosen) {
      setItems((prev) => [
        ...prev,
        {
          ingredientId: chosen.id,
          quantity: 20,
          unitCost: chosen.costPerUnit,
        },
      ]);
    }
  };

  const updateItemRow = (
    index: number,
    field: "ingredientId" | "quantity" | "unitCost",
    value: any
  ) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        if (field === "ingredientId") {
          const ing = ingredients.find((i) => i.id === value);
          return {
            ...row,
            ingredientId: value,
            unitCost: ing?.costPerUnit ?? row.unitCost,
          };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalEstimate = items.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim()) {
      alert("Please enter a supplier name");
      return;
    }
    if (items.some((i) => !i.ingredientId || i.quantity <= 0)) {
      alert("All lines must have a valid ingredient and positive quantity");
      return;
    }
    onSubmit({
      supplier: supplier.trim(),
      notes: notes.trim() || undefined,
      items,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Create Purchase Order (PO)</h3>
              <p className="text-xs text-slate-400">Restock warehouse inventory batches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Supplier Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Select Supplier / Distributor
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {suppliersList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Line items list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Restock Items
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => {
                const ing = ingredients.find((i) => i.id === row.ingredientId);
                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-2"
                  >
                    {/* Ingredient Select */}
                    <select
                      value={row.ingredientId}
                      onChange={(e) => updateItemRow(idx, "ingredientId", e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.unit})
                        </option>
                      ))}
                    </select>

                    {/* Qty */}
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateItemRow(idx, "quantity", parseFloat(e.target.value) || 0)
                        }
                        placeholder="Qty"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCost}
                        onChange={(e) =>
                          updateItemRow(idx, "unitCost", parseFloat(e.target.value) || 0)
                        }
                        placeholder="Cost"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
                      />
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length <= 1}
                      className="p-1.5 text-slate-500 hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              PO Notes / Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard weekly restock or expedited delivery"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Total Cost Estimate Banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Estimated Total Cost:</span>
            <span className="text-base font-black text-orange-400">
              {formatCurrency(totalEstimate)}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
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
              <span>{isSubmitting ? "Submitting..." : "Generate Purchase Order"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
