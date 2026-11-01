"use client";

import React, { useState } from "react";
import { X, User, Package, DollarSign, Calendar, FileText, CheckCircle2, Clock } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface AddSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingPersons?: string[];
  existingItems?: string[];
}

const COMMON_PERSONS = ["Ahmed", "Ali", "Tariq", "Babar", "City Bakers", "Punjab Dairy"];
const COMMON_ITEMS = [
  "Fresh Onions",
  "Potatoes",
  "Fresh Chicken",
  "Shami Kabab Patties",
  "Burger Buns & Bread",
  "Pizza Cheese Blend",
  "Cooking Oil",
  "Tomatoes & Chillies",
  "Eggs (Tray)",
];

const COMMON_UNITS = ["kg", "pcs", "packets", "crates", "liters", "bags"];

export default function AddSupplyModal({
  isOpen,
  onClose,
  onSuccess,
  existingPersons = [],
  existingItems = [],
}: AddSupplyModalProps) {
  const [personName, setPersonName] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("kg");
  const [totalCost, setTotalCost] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PAID");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Merge presets with existing database entries
  const allPersons = Array.from(new Set([...COMMON_PERSONS, ...existingPersons])).slice(0, 8);
  const allItems = Array.from(new Set([...COMMON_ITEMS, ...existingItems])).slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!personName.trim()) {
      setErrorMsg("Please write the name of the person who brought the supply.");
      return;
    }

    if (!itemName.trim()) {
      setErrorMsg("Please write the item / thing bought (e.g. Onions, Potatoes, Chicken).");
      return;
    }

    const costNum = parseFloat(totalCost);
    if (isNaN(costNum) || costNum <= 0) {
      setErrorMsg("Please enter the price or money given (must be greater than 0).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: personName.trim(),
          itemName: itemName.trim(),
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || "kg",
          totalCost: costNum,
          paymentStatus,
          date: new Date(date).toISOString(),
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save entry");
      }

      soundManager.playSuccessTone();
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record purchase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Record Daily Purchase / Supply</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter person name, thing bought, and money given
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. Name of the Person */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>Name of Person / Vendor *</span>
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Ahmed, Ali, Tariq, Babar, City Bakers..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
              required
            />
            {/* Quick Person Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick pick:</span>
              {allPersons.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPersonName(p)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                    personName === p
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/50 font-bold"
                      : "bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Thing / Item Bought */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thing / Item Bought *</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Onions, Potatoes, Chicken, Shami, Bread/Buns..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            {/* Quick Item Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick pick:</span>
              {allItems.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setItemName(item)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                    itemName === item
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold"
                      : "bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Quantity</label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Price / Money Given (PKR) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Price / Money Given (Rs.) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-orange-400">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                min="1"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-base font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* 5. Payment Status: Paid vs Pending (Udhaar) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Payment Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatus("PAID")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentStatus === "PAID"
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-sm"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cash Paid (ادا ہو گیا)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus("PENDING")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentStatus === "PENDING"
                    ? "bg-amber-600/20 text-amber-300 border-amber-500 shadow-sm"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pending / Udhaar (ادھار)</span>
              </button>
            </div>
          </div>

          {/* 6. Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Purchase Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* 7. Optional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes / Remarks (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery boy phone: 0300-1234567, Mandi rate"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Purchase Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
