"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IngredientDto,
  StockTransactionDto,
  PurchaseOrderDto,
} from "@/lib/types";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { soundManager } from "@/lib/sound";
import AdjustmentModal from "./AdjustmentModal";
import CreatePoModal from "./CreatePoModal";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  Sliders,
  TrendingDown,
  History,
  ShoppingCart,
  CheckCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function InventoryManagement() {
  const queryClient = useQueryClient();

  // Active sub-view: "stock" | "po" | "audit"
  const [activeTab, setActiveTab] = useState<"stock" | "po" | "audit">("stock");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals state
  const [adjustingIngredient, setAdjustingIngredient] =
    useState<IngredientDto | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [inspectingBomIngredient, setInspectingBomIngredient] =
    useState<any | null>(null);

  // Fetch Inventory
  const { data: invData, isLoading: isLoadingInv } = useQuery<{
    success: boolean;
    ingredients: (IngredientDto & { recipeItems?: any[]; stockValue: number })[];
    recentTransactions: StockTransactionDto[];
  }>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      return res.json();
    },
  });

  // Fetch Purchase Orders
  const { data: poData, isLoading: isLoadingPo } = useQuery<{
    success: boolean;
    purchaseOrders: PurchaseOrderDto[];
  }>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await fetch("/api/purchase-orders");
      return res.json();
    },
  });

  const ingredients = invData?.ingredients || [];
  const transactions = invData?.recentTransactions || [];
  const purchaseOrders = poData?.purchaseOrders || [];

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (ing.supplier && ing.supplier.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesLow = onlyLowStock ? ing.status === "LOW" || ing.status === "OUT_OF_STOCK" : true;
    return matchesSearch && matchesLow;
  });

  // Mutation: Log Stock Adjustment
  const adjustStockMutation = useMutation({
    mutationFn: async (payload: {
      ingredientId: string;
      type: "WASTE" | "ADJUSTMENT" | "RESTOCK";
      quantity: number;
      reason: string;
    }) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      soundManager.playSuccessTone();
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setAdjustingIngredient(null);
    },
    onError: (err: any) => {
      alert(`Adjustment failed: ${err.message}`);
    },
  });

  // Mutation: Create PO
  const createPoMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      soundManager.playSuccessTone();
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsPoModalOpen(false);
    },
    onError: (err: any) => {
      alert(`PO creation failed: ${err.message}`);
    },
  });

  // Mutation: Receive PO (Restock batch into inventory)
  const receivePoMutation = useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECEIVED" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      soundManager.playSuccessTone();
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (err: any) => {
      alert(`Failed to receive PO: ${err.message}`);
    },
  });

  // KPI calculations
  const totalStockValue = ingredients.reduce((sum, i) => sum + (i.stockValue || 0), 0);
  const lowStockCount = ingredients.filter(
    (i) => i.status === "LOW" || i.status === "OUT_OF_STOCK"
  ).length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* KPI Overview Cards */}
      <div className="p-4 sm:p-6 bg-slate-900/60 border-b border-slate-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Ingredients</p>
              <h3 className="text-xl font-black text-white">{ingredients.length} items</h3>
            </div>
          </div>

          <div
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
              lowStockCount > 0
                ? "bg-red-950/30 border-red-500/40 text-red-300 hover:border-red-500"
                : "bg-slate-900/90 border-slate-800 text-slate-300"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                lowStockCount > 0
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Low Stock Alerts</p>
              <h3 className="text-xl font-black text-white">
                {lowStockCount} {lowStockCount > 0 && "(Click to filter)"}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Warehouse Value</p>
              <h3 className="text-xl font-black text-white">
                {formatCurrency(totalStockValue)}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Active POs</p>
              <h3 className="text-xl font-black text-white">
                {purchaseOrders.filter((po) => po.status === "PENDING").length} Pending
              </h3>
            </div>
          </div>
        </div>

        {/* View Tab Nav & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "stock"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Raw Ingredients & BOM
            </button>
            <button
              onClick={() => setActiveTab("po")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "po"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "audit"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Audit Trail ({transactions.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "stock" && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter by ingredient or supplier..."
                  className="bg-slate-800/90 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            )}

            <button
              onClick={() => setIsPoModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Restock PO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* TAB 1: Stock Master */}
        {activeTab === "stock" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-5">Ingredient Name</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Stock Level</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Cost / Unit</th>
                    <th className="p-3.5">Total Value</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredIngredients.map((ing) => {
                    const pct = Math.min(
                      100,
                      Math.round((ing.currentStock / (ing.reorderThreshold * 2.5)) * 100)
                    );
                    const isLow = ing.status === "LOW" || ing.status === "OUT_OF_STOCK";

                    return (
                      <tr
                        key={ing.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white text-sm">{ing.name}</div>
                          <span className="text-[11px] text-slate-400">Unit: {ing.unit}</span>
                        </td>

                        <td className="p-3.5 text-slate-300">
                          {ing.supplier || "Warehouse Stock"}
                        </td>

                        <td className="p-3.5 min-w-[180px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200">
                              {ing.currentStock} {ing.unit}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Min: {ing.reorderThreshold} {ing.unit}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${Math.max(5, pct)}%` }}
                              className={`h-full rounded-full transition-all ${
                                ing.status === "OUT_OF_STOCK"
                                  ? "bg-red-500"
                                  : ing.status === "LOW"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              ing.status === "OUT_OF_STOCK"
                                ? "bg-red-500/20 text-red-300 border-red-500/40"
                                : ing.status === "LOW"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            }`}
                          >
                            {ing.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-300">
                          {formatCurrency(ing.costPerUnit)}
                        </td>

                        <td className="p-3.5 font-bold text-orange-400">
                          {formatCurrency(ing.stockValue)}
                        </td>

                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Recipe BOM Inspect Button */}
                            <button
                              onClick={() => setInspectingBomIngredient(ing)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60"
                              title="Inspect linked recipe Bill of Materials"
                            >
                              Recipe BOM
                            </button>

                            {/* Adjust / Waste button */}
                            <button
                              onClick={() => setAdjustingIngredient(ing)}
                              className="px-2.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white text-xs font-semibold border border-orange-500/40 transition-colors"
                            >
                              Log Waste / Delta
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Purchase Orders View */}
        {activeTab === "po" && (
          <div className="space-y-4">
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>No purchase orders recorded yet</p>
              </div>
            ) : (
              purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-white">{po.poNumber}</span>
                      <span className="text-xs text-slate-400">
                        Supplier: <strong className="text-slate-200">{po.supplier}</strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          po.status === "RECEIVED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total PO Cost:</span>
                        <div className="text-base font-black text-orange-400">
                          {formatCurrency(po.totalCost)}
                        </div>
                      </div>

                      {po.status === "PENDING" && (
                        <button
                          onClick={() => receivePoMutation.mutate(po.id)}
                          disabled={receivePoMutation.isPending}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>Receive Batch & Restock</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PO Line Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {po.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">
                            {item.ingredient?.name || "Ingredient"}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {item.quantity} {item.ingredient?.unit} @ {formatCurrency(item.unitCost)}
                          </span>
                        </div>
                        <span className="font-black text-orange-400">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {po.notes && (
                    <p className="text-xs text-slate-400 italic">Notes: {po.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Recent Audit Trail */}
        {activeTab === "audit" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-5">Timestamp</th>
                    <th className="p-3.5">Ingredient</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Quantity Delta</th>
                    <th className="p-3.5 pr-5">Audit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 pl-5 text-slate-400">
                        {formatTimeAgo(tx.createdAt)}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {tx.ingredient?.name}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.type === "USAGE"
                              ? "bg-blue-500/20 text-blue-300"
                              : tx.type === "RESTOCK"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : tx.type === "WASTE"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className={`p-3.5 font-black ${
                          tx.quantity > 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}{" "}
                        {tx.ingredient?.unit}
                      </td>
                      <td className="p-3.5 pr-5 text-slate-300">
                        {tx.reason || "Automated transaction"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Stock Adjustment / Waste Modal */}
      {adjustingIngredient && (
        <AdjustmentModal
          ingredient={adjustingIngredient}
          onClose={() => setAdjustingIngredient(null)}
          onSubmit={(data) => adjustStockMutation.mutate(data)}
          isSubmitting={adjustStockMutation.isPending}
        />
      )}

      {/* Create Purchase Order Modal */}
      {isPoModalOpen && (
        <CreatePoModal
          ingredients={ingredients}
          onClose={() => setIsPoModalOpen(false)}
          onSubmit={(data) => createPoMutation.mutate(data)}
          isSubmitting={createPoMutation.isPending}
        />
      )}

      {/* Recipe BOM Dependencies Inspector Modal */}
      {inspectingBomIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-white text-base">
                  Recipe BOM: {inspectingBomIngredient.name}
                </h4>
                <p className="text-xs text-slate-400">
                  Menu items that automatically deduct this ingredient
                </p>
              </div>
              <button
                onClick={() => setInspectingBomIngredient(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inspectingBomIngredient.recipeItems?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No menu recipes currently link this item
                </p>
              ) : (
                inspectingBomIngredient.recipeItems?.map((ri: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-white">
                      {ri.menuItem?.name || "Menu Item"}
                    </span>
                    <span className="font-bold text-orange-400">
                      Deducts: {ri.quantityRequired} {inspectingBomIngredient.unit} / serving
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectingBomIngredient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
