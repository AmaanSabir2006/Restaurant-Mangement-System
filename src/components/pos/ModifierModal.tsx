"use client";

import React, { useState, useMemo } from "react";
import { MenuItemDto, ModifierDto, ItemSizeOption } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Plus, Check, Pizza, Sparkles } from "lucide-react";

interface ModifierModalProps {
  item: MenuItemDto;
  availableModifiers: ModifierDto[];
  onClose: () => void;
  onAddWithModifiers: (
    item: MenuItemDto,
    selectedModifierIds: string[],
    notes: string,
    selectedSize?: string,
    unitPrice?: number
  ) => void;
}

// Built-in standard add-ons matching Pizza World flyer specs
const PIZZA_EXTRA_TOPPING_PRICES: Record<string, number> = {
  Small: 100,
  Medium: 200,
  Large: 250,
  "X-Large": 350,
};

const STANDARD_ADDONS = [
  { id: "mod_cheese", name: "Extra Mozzarella Cheese", price: 150 },
  { id: "mod_chicken", name: "Extra Chicken Chunks", price: 150 },
  { id: "mod_olives_jalapenos", name: "Extra Jalapenos & Olives", price: 70 },
  { id: "mod_peri_dip", name: "Spicy Peri Peri Dip Sauce", price: 50 },
  { id: "mod_garlic_dip", name: "Garlic Mayo Dip Sauce", price: 40 },
];

export default function ModifierModal({
  item,
  availableModifiers,
  onClose,
  onAddWithModifiers,
}: ModifierModalProps) {
  // Parse size options safely
  const sizeOptions: ItemSizeOption[] = useMemo(() => {
    if (item.sizeOptions && item.sizeOptions.length > 0) {
      return item.sizeOptions;
    }
    if (item.sizes) {
      try {
        const parsed = JSON.parse(item.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  }, [item]);

  // Default selected size: prefer "Medium" if available, else first option
  const defaultSizeName = useMemo(() => {
    if (sizeOptions.length === 0) return undefined;
    const hasMedium = sizeOptions.find(
      (s) => s.name.toLowerCase() === "medium"
    );
    return hasMedium ? hasMedium.name : sizeOptions[0].name;
  }, [sizeOptions]);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    defaultSizeName
  );
  const [selectedModIds, setSelectedModIds] = useState<string[]>([]);
  const [extraToppingSelected, setExtraToppingSelected] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  // Base price based on size
  const currentSizeOption = useMemo(() => {
    if (!selectedSize || sizeOptions.length === 0) return null;
    return sizeOptions.find((s) => s.name === selectedSize) || sizeOptions[0];
  }, [selectedSize, sizeOptions]);

  const basePrice = currentSizeOption ? currentSizeOption.price : item.price;

  // Extra topping price for current size (if item is pizza)
  const isPizza = item.category === "Pizzas";
  const extraToppingPrice = useMemo(() => {
    if (!isPizza) return 150;
    const key = selectedSize || "Small";
    return PIZZA_EXTRA_TOPPING_PRICES[key] || 150;
  }, [isPizza, selectedSize]);

  // Combine available modifiers
  const allAddons = useMemo(() => {
    const list = [...STANDARD_ADDONS];
    availableModifiers.forEach((m) => {
      if (!list.some((existing) => existing.name === m.name)) {
        list.push({ id: m.id, name: m.name, price: m.price });
      }
    });
    return list;
  }, [availableModifiers]);

  const toggleModifier = (modId: string) => {
    setSelectedModIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  // Financial total calculation
  const extraTotal = useMemo(() => {
    let sum = 0;
    if (extraToppingSelected) {
      sum += extraToppingPrice;
    }
    selectedModIds.forEach((id) => {
      const mod = allAddons.find((m) => m.id === id);
      if (mod) sum += mod.price;
    });
    return sum;
  }, [extraToppingSelected, extraToppingPrice, selectedModIds, allAddons]);

  const finalUnitPrice = basePrice + extraTotal;

  const handleConfirm = () => {
    // Collect notes including custom toppings if chosen
    const instructionParts: string[] = [];
    if (extraToppingSelected) {
      instructionParts.push(`Extra Pizza Topping (+${formatCurrency(extraToppingPrice)})`);
    }
    if (notes.trim()) {
      instructionParts.push(notes.trim());
    }
    const combinedNotes = instructionParts.join(" | ");

    onAddWithModifiers(
      item,
      selectedModIds,
      combinedNotes,
      selectedSize,
      finalUnitPrice
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                {item.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">{item.sku}</span>
            </div>
            <h3 className="text-lg font-black text-slate-100 truncate mt-0.5">
              {item.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Base Item Preview Header */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-800 rounded-xl border border-slate-700">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                onError={(e) => {
                  const fallback = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80";
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-100 text-sm truncate">{item.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                {item.description || "Freshly made with secret spices & premium ingredients."}
              </p>
            </div>
          </div>

          {/* SIZES SELECTION SECTION (If item has sizes) */}
          {sizeOptions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Pizza className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>Choose Size / Portion</span>
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedSize ? `Selected: ${selectedSize}` : "Required"}
                </span>
              </div>

              <div
                className={`grid gap-2 ${
                  sizeOptions.length === 2
                    ? "grid-cols-2"
                    : sizeOptions.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-4"
                }`}
              >
                {sizeOptions.map((opt) => {
                  const isSelected = selectedSize === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setSelectedSize(opt.name)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-600/10 border-2 border-orange-600 text-slate-100 shadow-sm"
                          : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <span className="text-xs font-bold tracking-wide">{opt.name}</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1">
                        {formatCurrency(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PIZZA EXTRA TOPPING SECTION (Per Flyer Spec) */}
          {isPizza && (
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-bold text-slate-100">Extra Pizza Topping</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Extra layer of marinated chicken chunks & premium cheese
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExtraToppingSelected(!extraToppingSelected)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    extraToppingSelected
                      ? "bg-orange-600 text-white shadow-sm ring-1 ring-orange-500"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  {extraToppingSelected && <Check className="w-3 h-3" />}
                  <span>+{formatCurrency(extraToppingPrice)}</span>
                </button>
              </div>
            </div>
          )}

          {/* EXTRA ADD-ONS & SIDES */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-100 uppercase tracking-wider block">
              Additional Add-ons & Dips
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allAddons.map((mod) => {
                const isSelected = selectedModIds.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModifier(mod.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-orange-600/10 border-2 border-orange-600 text-slate-100 shadow-sm"
                        : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-orange-600 border-orange-600 text-white"
                            : "border-slate-600 bg-slate-900"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-semibold truncate">{mod.name}</span>
                    </div>
                    <span
                      className={`text-xs font-bold ml-2 shrink-0 ${
                        mod.price > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {mod.price > 0 ? `+${formatCurrency(mod.price)}` : "Free"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kitchen instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-100 uppercase tracking-wider block">
              Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Well done crust, less spicy, sauce on the side..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[11px] text-slate-400">
              {selectedSize ? `${selectedSize} Portion` : "Standard Unit"}
              {extraTotal > 0 && ` • +${formatCurrency(extraTotal)} add-ons`}
            </div>
            <div className="text-xl font-black text-orange-600 dark:text-orange-400">
              {formatCurrency(finalUnitPrice)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
