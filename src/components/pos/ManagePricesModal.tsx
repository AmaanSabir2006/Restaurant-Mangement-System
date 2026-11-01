"use client";

import React, { useState, useMemo } from "react";
import { MenuItemDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Search, Tag, Pencil, Check, Utensils } from "lucide-react";

interface ManagePricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItemDto[];
  onEditItemPrice: (item: MenuItemDto) => void;
}

export default function ManagePricesModal({
  isOpen,
  onClose,
  items,
  onEditItemPrice,
}: ManagePricesModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.category)));
    return ["All", ...cats];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  Product Price Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {items.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Update prices as costs change over time. Changes apply immediately to new tickets.
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

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product by name or SKU..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3.5">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Current Price</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredItems.map((item) => {
                  let sizeText = "";
                  if (item.sizeOptions && item.sizeOptions.length > 0) {
                    sizeText = item.sizeOptions.map((s) => `${s.name}: Rs. ${s.price}`).join(" | ");
                  } else if (item.sizes) {
                    try {
                      const parsed = JSON.parse(item.sizes);
                      if (Array.isArray(parsed)) {
                        sizeText = parsed.map((s: any) => `${s.name}: Rs. ${s.price}`).join(" | ");
                      }
                    } catch {}
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                              <Utensils className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-100 block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {sizeText ? (
                          <div>
                            <span className="font-black text-orange-600 dark:text-orange-400 font-mono text-sm block">
                              From {formatCurrency(item.price)}
                            </span>
                            <span className="text-[10px] text-slate-400 block max-w-xs truncate">
                              {sizeText}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-orange-600 dark:text-orange-400 font-mono text-base">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onEditItemPrice(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-300 border border-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Change Price</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No products matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Showing {filteredItems.length} of {items.length} products
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
