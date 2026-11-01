"use client";

import React, { useState } from "react";
import { IngredientDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Check, User, Package, Scale, Plus } from "lucide-react";

interface ReceiveStockModalProps {
  ingredients: IngredientDto[];
  preselectedIngredientId?: string;
  onClose: () => void;
  onReceiveStock: (payload: {
    ingredientId?: string;
    newIngredientName?: string;
    unit?: string;
    quantity: number;
    supplier: string;
    costPerUnit?: number;
    totalCost?: number;
    reason?: string;
  }) => void;
  isSubmitting: boolean;
}

const COMMON_PERSONS = ["Ahmed", "Ali", "Tariq", "City Bakers", "Dairy King"];

export default function ReceiveStockModal({
  ingredients,
  preselectedIngredientId,
  onClose,
  onReceiveStock,
  isSubmitting,
}: ReceiveStockModalProps) {
  const [isNewItem, setIsNewItem] = useState<boolean>(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(
    preselectedIngredientId || ingredients[0]?.id || ""
  );
  const [newItemName, setNewItemName] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("kg");
  const [totalCost, setTotalCost] = useState<string>("");

  const selectedIngredient = ingredients.find((i) => i.id === selectedIngredientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPerson = personName.trim();
    if (!cleanPerson) {
      alert("Please enter who brought this stock (e.g. Ahmed, Ali).");
      return;
    }

    const parsedQty = parseFloat(quantity) || 0;
    if (parsedQty <= 0) {
      alert("Please enter a quantity greater than 0.");
      return;
    }

    if (isNewItem && !newItemName.trim()) {
      alert("Please enter the name of the new item.");
      return;
    }

    const parsedCost = parseFloat(totalCost) || undefined;
    const finalUnit = isNewItem ? unit : selectedIngredient?.unit || unit;

    onReceiveStock({
      ingredientId: isNewItem ? undefined : selectedIngredientId,
      newIngredientName: isNewItem ? newItemName.trim() : undefined,
      unit: finalUnit,
      quantity: parsedQty,
      supplier: cleanPerson,
      totalCost: parsedCost,
      reason: `Delivered by ${cleanPerson}: ${parsedQty} ${finalUnit}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Simple Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>📦</span>
              <span>Add Received Stock</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Record daily delivery (e.g. Ahmed brought 1 kg Onions)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean, Simple Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Step 1: Who brought it? */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>1. Who brought it? (Person / Vendor)</span>
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Ahmed, Ali"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
            {/* Quick Person Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {COMMON_PERSONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPersonName(name)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    personName === name
                      ? "bg-orange-600 border-orange-600 text-white font-bold"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: What item is it? */}
          <div className="space-y-1.5 pt-1 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>2. What item?</span>
              </label>
              <button
                type="button"
                onClick={() => setIsNewItem(!isNewItem)}
                className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
              >
                {isNewItem ? "← Choose existing item" : "+ Add new item"}
              </button>
            </div>

            {isNewItem ? (
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Fresh Onions, Meat, Cheese"
                  className="col-span-2 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="kg">kg</option>
                  <option value="g">grams</option>
                  <option value="pcs">pieces</option>
                  <option value="liter">liters</option>
                </select>
              </div>
            ) : (
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-slate-900 text-slate-100">
                    {ing.name} (Current: {ing.currentStock} {ing.unit})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 3: How much? */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>3. How much?</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1, 2, 5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  {isNewItem ? unit : selectedIngredient?.unit || "kg"}
                </span>
              </div>
            </div>

            {/* Total Cost (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-100">
                Total Cost (Optional Rs.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="e.g. 250"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Friendly Preview Tag */}
          {parseFloat(quantity) > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>
                Adding <strong>+{quantity} {isNewItem ? unit : selectedIngredient?.unit || "kg"}</strong> from{" "}
                <strong>{personName || "Person"}</strong>
              </span>
              {parseFloat(totalCost) > 0 && (
                <span className="font-bold">{formatCurrency(parseFloat(totalCost))}</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Delivery"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
