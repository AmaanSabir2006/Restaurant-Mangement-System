"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MenuItemDto,
  OrderType,
  PaymentMethod,
  OrderDto,
  ModifierDto,
} from "@/lib/types";
import { formatCurrency, AVAILABLE_COUPONS } from "@/lib/utils";
import ModifierModal from "./ModifierModal";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Car,
  Truck,
  Sparkles,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  Flame,
  TicketPercent,
} from "lucide-react";

interface BasketItem {
  cartItemId: string; // unique key in cart
  item: MenuItemDto;
  quantity: number;
  selectedModifierIds: string[];
  appliedModifiers: ModifierDto[];
  notes: string;
  unitPrice: number;
}

const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Burgers", icon: "🍔" },
  { name: "Sides", icon: "🍟" },
  { name: "Beverages", icon: "🥤" },
  { name: "Combos", icon: "🍱" },
  { name: "Deals", icon: "🔥" },
];

export default function PosTerminal({ employeeId }: { employeeId?: string }) {
  const queryClient = useQueryClient();

  // Categories & Search Filter
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Basket State
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [customerName, setCustomerName] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    label: string;
    discount: number;
  } | null>(null);

  // Modals State
  const [customizingItem, setCustomizingItem] = useState<MenuItemDto | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<OrderDto | null>(null);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    tenderAmount: number;
    change: number;
  } | null>(null);

  // Fetch Menu Items
  const { data: menuData, isLoading: isLoadingMenu } = useQuery<{
    success: boolean;
    items: MenuItemDto[];
  }>({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      return res.json();
    },
  });

  const menuItems = menuData?.items || [];

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Extract all available modifiers from loaded items
  const allAvailableModifiers = useMemo(() => {
    const map = new Map<string, ModifierDto>();
    menuItems.forEach((item) => {
      item.modifiers?.forEach((mod) => {
        map.set(mod.id, mod);
      });
    });
    return Array.from(map.values());
  }, [menuItems]);

  // Quick Add Item (No modifiers)
  const handleQuickAdd = (item: MenuItemDto) => {
    setBasket((prev) => {
      const existing = prev.find(
        (b) =>
          b.item.id === item.id &&
          b.selectedModifierIds.length === 0 &&
          b.notes === ""
      );
      if (existing) {
        return prev.map((b) =>
          b.cartItemId === existing.cartItemId
            ? { ...b, quantity: b.quantity + 1 }
            : b
        );
      }
      return [
        ...prev,
        {
          cartItemId: `${item.id}-${Date.now()}-${Math.random()}`,
          item,
          quantity: 1,
          selectedModifierIds: [],
          appliedModifiers: [],
          notes: "",
          unitPrice: item.price,
        },
      ];
    });
  };

  // Add Item with Modifiers & Notes
  const handleAddWithModifiers = (
    item: MenuItemDto,
    selectedModifierIds: string[],
    notes: string
  ) => {
    const appliedModifiers = allAvailableModifiers.filter((m) =>
      selectedModifierIds.includes(m.id)
    );
    const modPriceSum = appliedModifiers.reduce((acc, m) => acc + m.price, 0);
    const unitPrice = item.price + modPriceSum;

    setBasket((prev) => [
      ...prev,
      {
        cartItemId: `${item.id}-${Date.now()}-${Math.random()}`,
        item,
        quantity: 1,
        selectedModifierIds,
        appliedModifiers,
        notes,
        unitPrice,
      },
    ]);
  };

  // Basket item quantity adjusters
  const updateQuantity = (cartItemId: string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((b) => {
          if (b.cartItemId === cartItemId) {
            const newQty = b.quantity + delta;
            return newQty > 0 ? { ...b, quantity: newQty } : null;
          }
          return b;
        })
        .filter(Boolean) as BasketItem[]
    );
  };

  const removeBasketItem = (cartItemId: string) => {
    setBasket((prev) => prev.filter((b) => b.cartItemId !== cartItemId));
  };

  const clearBasket = () => {
    setBasket([]);
    setCustomerName("");
    setOrderNotes("");
    setCouponCode("");
    setAppliedCoupon(null);
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return basket.reduce((acc, b) => acc + b.unitPrice * b.quantity, 0);
  }, [basket]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.min(subtotal, appliedCoupon.discount);
  }, [appliedCoupon, subtotal]);

  const tax = useMemo(() => {
    return Math.round(subtotal * 0.08 * 100) / 100;
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round((subtotal + tax - discountAmount) * 100) / 100);
  }, [subtotal, tax, discountAmount]);

  // Apply Coupon Code
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const coupon = AVAILABLE_COUPONS[code];
    if (coupon) {
      let disc = 0;
      if (coupon.type === "FIXED") {
        disc = coupon.value;
      } else {
        disc = Math.round(((subtotal * coupon.value) / 100) * 100) / 100;
      }
      setAppliedCoupon({
        code,
        label: coupon.label,
        discount: disc,
      });
    } else {
      alert("Invalid coupon code. Try SAVE100, BURGER10, or FEAST20.");
    }
  };

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (payload: {
      paymentMethod: PaymentMethod;
      tenderAmount: number;
      change: number;
    }) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          customerName: customerName.trim() || undefined,
          notes: orderNotes.trim() || undefined,
          paymentMethod: payload.paymentMethod,
          paymentStatus: "PAID",
          discount: discountAmount,
          couponCode: appliedCoupon?.code,
          employeeId: employeeId || undefined,
          items: basket.map((b) => ({
            menuItemId: b.item.id,
            quantity: b.quantity,
            notes: b.notes || undefined,
            modifierIds: b.selectedModifierIds,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return { order: data.order, ...payload };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setLastPaymentInfo({
        tenderAmount: data.tenderAmount,
        change: data.change,
      });
      setCompletedOrder(data.order);
      setIsPaymentModalOpen(false);
      clearBasket();
    },
    onError: (err: any) => {
      alert(`Order placement failed: ${err.message}`);
    },
  });

  const handleConfirmPayment = (
    method: PaymentMethod,
    tenderAmount: number,
    change: number
  ) => {
    createOrderMutation.mutate({ paymentMethod: method, tenderAmount, change });
  };

  // Keyboard shortcut Esc to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPaymentModalOpen && !customizingItem && !completedOrder) {
        if (basket.length > 0 && confirm("Clear current order ticket?")) {
          clearBasket();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [basket, isPaymentModalOpen, customizingItem, completedOrder]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* LEFT COLUMN: Menu Categories, Search & Items Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-800">
        {/* Top Control Bar: Search & Category Badges */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu by name or SKU (e.g. BRG-001)..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Item Counter Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700/70 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>{filteredItems.length} Items</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count =
                cat.name === "All"
                  ? menuItems.length
                  : menuItems.filter((i) => i.category === cat.name).length;

              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-orange-400/40"
                      : "bg-slate-800/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-black/25 text-white" : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoadingMenu ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-56 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Flame className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-slate-300 font-bold text-sm">No menu items found</p>
              <p className="text-slate-500 text-xs mt-1">Try another category or clear search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredItems.map((item) => {
                const hasModifiers = item.modifiers && item.modifiers.length > 0;
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-orange-500/50 shadow-md hover:shadow-orange-500/10 transition-all duration-200 overflow-hidden relative"
                  >
                    {/* Item Image with Prep & Calorie Badges */}
                    <div className="relative h-32 sm:h-36 w-full bg-slate-950 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Utensils className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900/80 backdrop-blur text-slate-300 rounded border border-slate-700/60">
                          {item.sku}
                        </span>
                      </div>

                      {/* Prep time badge */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-amber-300 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{item.prepTimeMin}m</span>
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-orange-500 text-white font-black text-xs shadow-md">
                        {formatCurrency(item.price)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-orange-400 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {item.description || item.category}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                        {/* Quick Add Button */}
                        <button
                          onClick={() => handleQuickAdd(item)}
                          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-orange-500 active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title="Quick add to basket"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>

                        {/* Customize button */}
                        <button
                          onClick={() => setCustomizingItem(item)}
                          className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-colors border border-slate-700/60"
                          title="Customize add-ons & notes"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Order Ticket & Tender Panel (Sticky) */}
      <div className="w-full lg:w-[420px] xl:w-[450px] bg-slate-900 flex flex-col h-full border-t lg:border-t-0 border-slate-800 shadow-2xl">
        {/* Ticket Header & Order Type Picker */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <h3 className="font-black text-white text-base">Current Ticket</h3>
            </div>
            {basket.length > 0 && (
              <button
                onClick={clearBasket}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear (Esc)</span>
              </button>
            )}
          </div>

          {/* Order Type Buttons */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              { type: "DINE_IN" as OrderType, label: "Dine-In", icon: Utensils },
              { type: "TAKEAWAY" as OrderType, label: "Takeaway", icon: ShoppingBag },
              { type: "DRIVE_THRU" as OrderType, label: "Drive-Thru", icon: Car },
              { type: "DELIVERY" as OrderType, label: "Delivery", icon: Truck },
            ].map((ot) => {
              const Icon = ot.icon;
              const isSelected = orderType === ot.type;
              return (
                <button
                  key={ot.type}
                  type="button"
                  onClick={() => setOrderType(ot.type)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mb-0.5" />
                  <span>{ot.label}</span>
                </button>
              );
            })}
          </div>

          {/* Customer / Reference Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name / Table / Vehicle..."
              className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {basket.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500">
              <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-50" />
              <p className="font-semibold text-xs text-slate-400">Your basket is empty</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Click items on the left to add them to this order ticket.
              </p>
            </div>
          ) : (
            basket.map((b) => (
              <div
                key={b.cartItemId}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-white text-xs truncate">
                      {b.item.name}
                    </h5>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(b.unitPrice)} each
                    </div>
                  </div>

                  {/* Quantity adjustment & Line total */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                      <button
                        onClick={() => updateQuantity(b.cartItemId, -1)}
                        className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-white">
                        {b.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(b.cartItemId, 1)}
                        className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-16 text-right font-black text-xs text-orange-400">
                      {formatCurrency(b.unitPrice * b.quantity)}
                    </div>

                    <button
                      onClick={() => removeBasketItem(b.cartItemId)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Modifiers List */}
                {b.appliedModifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {b.appliedModifiers.map((mod) => (
                      <span
                        key={mod.id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30"
                      >
                        +{mod.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Special Instructions Note */}
                {b.notes && (
                  <p className="text-[10px] text-amber-300/90 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    &quot;{b.notes}&quot;
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Financial Calculation Breakdown & Coupon Code */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Coupon Code Input */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <TicketPercent className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon (e.g. SAVE100, BURGER10)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700"
            >
              Apply
            </button>
          </div>

          {/* Applied Coupon Tag */}
          {appliedCoupon && (
            <div className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300">
              <span>{appliedCoupon.label}</span>
              <button
                onClick={() => setAppliedCoupon(null)}
                className="text-xs hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Line by line totals */}
          <div className="space-y-1.5 text-xs text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Sales Tax (8%):</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 text-base font-black text-white">
              <span>Total Due:</span>
              <span className="text-orange-400 text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout / Payment Trigger Button */}
          <button
            type="button"
            disabled={basket.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:pointer-events-none active:scale-98 text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Proceed to Payment</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modifiers Modal */}
      {customizingItem && (
        <ModifierModal
          item={customizingItem}
          availableModifiers={allAvailableModifiers}
          onClose={() => setCustomizingItem(null)}
          onAddWithModifiers={handleAddWithModifiers}
        />
      )}

      {/* Payment Processing Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          totalAmount={grandTotal}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirmPayment={handleConfirmPayment}
          isSubmitting={createOrderMutation.isPending}
        />
      )}

      {/* Printable Thermal Receipt Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          tenderAmount={lastPaymentInfo?.tenderAmount}
          change={lastPaymentInfo?.change}
          onClose={() => setCompletedOrder(null)}
          onNewOrder={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
