"use client";

import React, { useState } from "react";
import { MenuItemDto, ModifierDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Plus, Check } from "lucide-react";

interface ModifierModalProps {
  item: MenuItemDto;
  availableModifiers: ModifierDto[];
  onClose: () => void;
  onAddWithModifiers: (
    item: MenuItemDto,
    selectedModifierIds: string[],
    notes: string
  ) => void;
}

export default function ModifierModal({
  item,
  availableModifiers,
  onClose,
  onAddWithModifiers,
}: ModifierModalProps) {
  const [selectedModIds, setSelectedModIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  const toggleModifier = (modId: string) => {
    setSelectedModIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const extraTotal = selectedModIds.reduce((sum, id) => {
    const mod = availableModifiers.find((m) => m.id === id);
    return sum + (mod?.price || 0);
  }, 0);

  const finalUnitPrice = item.price + extraTotal;

  const handleConfirm = () => {
    onAddWithModifiers(item, selectedModIds, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Customize {item.name}
            </h3>
            <p className="text-xs text-slate-400">
              Select add-ons, modifiers & special kitchen instructions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Base Item Preview */}
          <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover ring-1 ring-slate-700"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
              <p className="text-xs text-slate-400">Base Price: {formatCurrency(item.price)}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Current Unit</div>
              <div className="text-base font-bold text-orange-400">
                {formatCurrency(finalUnitPrice)}
              </div>
            </div>
          </div>

          {/* Add-ons & Modifiers list */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
              Available Add-ons & Options
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableModifiers.map((mod) => {
                const isSelected = selectedModIds.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModifier(mod.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-orange-500/15 border-orange-500 text-white shadow-sm ring-1 ring-orange-500/30"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "border-slate-600 bg-slate-900"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold truncate">{mod.name}</span>
                    </div>
                    <span
                      className={`text-xs font-bold ml-2 ${
                        mod.price > 0 ? "text-orange-400" : "text-emerald-400"
                      }`}
                    >
                      {mod.price > 0 ? `+${formatCurrency(mod.price)}` : "Free"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special kitchen instructions */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Special Kitchen Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Well done, extra crispy, sauce on the side..."
              rows={2}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Item Unit Total:</span>
            <div className="text-lg font-black text-white">
              {formatCurrency(finalUnitPrice)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
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
