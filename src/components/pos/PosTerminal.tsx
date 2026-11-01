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
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import ModifierModal from "./ModifierModal";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";
import EditPriceModal from "./EditPriceModal";
import ManagePricesModal from "./ManagePricesModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Truck,
  Sparkles,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Pencil,
  Tag,
} from "lucide-react";

interface BasketItem {
  cartItemId: string; // unique key in cart
  item: MenuItemDto;
  quantity: number;
  selectedSize?: string;
  selectedModifierIds: string[];
  appliedModifiers: ModifierDto[];
  notes: string;
  unitPrice: number;
}

const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Hot Deals", icon: "🔥" },
  { name: "Pizzas", icon: "🍕" },
  { name: "Burgers", icon: "🍔" },
  { name: "Shawarma & Rolls", icon: "🌯" },
  { name: "Fried Chicken", icon: "🍗" },
  { name: "Fries & Sides", icon: "🍟" },
  { name: "Pasta", icon: "🍝" },
  { name: "Sandwiches", icon: "🥪" },
  { name: "Ice Cream & Drinks", icon: "🍨" },
];

export const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  "Pizzas": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
  "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  "Hot Deals": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
  "Shawarma & Rolls": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80",
  "Fried Chicken": "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
  "Fries & Sides": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
  "Pasta": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
  "Sandwiches": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
  "Ice Cream & Drinks": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80",
};

export default function PosTerminal({ employeeId }: { employeeId?: string }) {
  const queryClient = useQueryClient();
  const { t, isUrdu } = useLanguage();

  // Categories & Search Filter
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Basket State
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Modals State
  const [customizingItem, setCustomizingItem] = useState<MenuItemDto | null>(null);
  const [editingPriceItem, setEditingPriceItem] = useState<MenuItemDto | null>(null);
  const [isManagePricesOpen, setIsManagePricesOpen] = useState<boolean>(false);
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
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

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

  // Helper to check if item has size options
  const hasItemSizes = (item: MenuItemDto) => {
    return Boolean(
      (item.sizeOptions && item.sizeOptions.length > 0) ||
      (item.sizes && item.sizes.length > 5)
    );
  };

  // Quick Add Item (Direct add for single-size items, or opens size modal for sized items)
  const handleQuickAdd = (item: MenuItemDto) => {
    if (hasItemSizes(item)) {
      setCustomizingItem(item);
      return;
    }
    const cartItemId = `${item.id}-std--`;
    setBasket((prev) => {
      const existing = prev.find((b) => b.cartItemId === cartItemId);
      if (existing) {
        return prev.map((b) =>
          b.cartItemId === cartItemId
            ? { ...b, quantity: b.quantity + 1 }
            : b
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          item,
          quantity: 1,
          selectedSize: undefined,
          selectedModifierIds: [],
          appliedModifiers: [],
          notes: "",
          unitPrice: item.price,
        },
      ];
    });
  };

  // Add Item with Modifiers, Selected Size & Notes
  const handleAddWithModifiers = (
    item: MenuItemDto,
    selectedModifierIds: string[],
    notes: string,
    selectedSize?: string,
    unitPrice?: number
  ) => {
    const appliedModifiers = allAvailableModifiers.filter((m) =>
      selectedModifierIds.includes(m.id)
    );
    const resolvedUnitPrice = typeof unitPrice === "number" ? unitPrice : item.price;
    const sizeKey = selectedSize || "std";
    const modKey = selectedModifierIds.slice().sort().join("_");
    const notesKey = notes ? notes.trim().toLowerCase() : "";
    const cartItemId = `${item.id}-${sizeKey}-${modKey}-${notesKey}`;

    setBasket((prev) => {
      const existing = prev.find((b) => b.cartItemId === cartItemId);
      if (existing) {
        return prev.map((b) =>
          b.cartItemId === cartItemId
            ? { ...b, quantity: b.quantity + 1 }
            : b
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          item,
          quantity: 1,
          selectedSize,
          selectedModifierIds,
          appliedModifiers,
          notes,
          unitPrice: resolvedUnitPrice,
        },
      ];
    });
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
    setCustomerPhone("");
    setDeliveryAddress("");
    setOrderNotes("");
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return basket.reduce((acc, b) => acc + b.unitPrice * b.quantity, 0);
  }, [basket]);

  const discountAmount = 0;

  const tax = useMemo(() => {
    return 0;
  }, []);

  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round((subtotal + tax) * 100) / 100);
  }, [subtotal, tax]);

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
          customerPhone: customerPhone.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          notes: orderNotes.trim() || undefined,
          paymentMethod: payload.paymentMethod,
          paymentStatus: "PAID",
          discount: 0,
          employeeId: employeeId || undefined,
          items: basket.map((b) => ({
            menuItemId: b.item.id,
            quantity: b.quantity,
            size: b.selectedSize || undefined,
            unitPrice: b.unitPrice,
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
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950">
      {/* LEFT COLUMN: Menu Categories, Search & Items Grid */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden border-r border-slate-700">
        {/* Top Control Bar: Search & Category Badges */}
        <div className="p-4 bg-slate-900 border-b border-slate-700 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search menu by name or SKU (e.g. BRG-001)...")}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Item Counter Badge & Manage Prices Button */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>{filteredItems.length} {t("Items")}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsManagePricesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Open Price Manager to view and adjust any product's price"
              >
                <Tag className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>{t("Edit Prices")}</span>
              </button>
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{t(cat.name)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-orange-700 text-white" : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pizza Categories Tip */}
          {selectedCategory === "Pizzas" && (
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-medium animate-in fade-in duration-150">
              <span className="flex items-center gap-1.5">
                <span>🍕</span>
                <span>All 29 flavors available in <strong>Small</strong>, <strong>Medium</strong>, <strong>Large</strong> & <strong>X-Large</strong></span>
              </span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">Click any pizza to select size & toppings</span>
            </div>
          )}
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
                const itemHasSizes = hasItemSizes(item);
                let priceLabel = formatCurrency(item.price);
                let sizeCount = 0;
                if (item.sizeOptions && item.sizeOptions.length > 0) {
                  sizeCount = item.sizeOptions.length;
                  const minPrice = Math.min(...item.sizeOptions.map((s) => s.price));
                  priceLabel = `${t("From")} ${formatCurrency(minPrice)}`;
                } else if (item.sizes) {
                  try {
                    const parsed = JSON.parse(item.sizes);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      sizeCount = parsed.length;
                      const minPrice = Math.min(...parsed.map((s: any) => s.price));
                      priceLabel = `${t("From")} ${formatCurrency(minPrice)}`;
                    }
                  } catch {}
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => itemHasSizes && setCustomizingItem(item)}
                    className={`group flex flex-col bg-slate-900 rounded-xl border border-slate-700/80 hover:border-orange-500 shadow-sm transition-all duration-150 overflow-hidden relative ${
                      itemHasSizes ? "cursor-pointer" : ""
                    }`}
                  >
                    {/* Item Image with Prep & Calorie Badges */}
                    <div className="relative h-32 sm:h-36 w-full bg-slate-800 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            const fallback =
                              FALLBACK_CATEGORY_IMAGES[item.category] ||
                              FALLBACK_CATEGORY_IMAGES["Pizzas"];
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Utensils className="w-8 h-8 text-slate-500" />
                        </div>
                      )}

                      {/* Top Badges */}
                      {itemHasSizes && (
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-600 text-white rounded">
                            {sizeCount > 0 ? `${sizeCount} ${t("Sizes")}` : t("Multi-Size")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        {/* Item Name & Single Prominent Price Tag */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors flex-1" title={item.name}>
                            {t(item.name)}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPriceItem(item);
                            }}
                            title="Click to edit/update price for this item"
                            className="shrink-0 px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-sm sm:text-base font-mono tracking-tight shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ring-1 ring-orange-500/40"
                          >
                            <span>{priceLabel}</span>
                            <Pencil className="w-3 h-3 text-orange-200" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-snug">
                          {item.description || item.category}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700/60" onClick={(e) => e.stopPropagation()}>
                        {itemHasSizes ? (
                          <>
                            <button
                              onClick={() => setCustomizingItem(item)}
                              className="flex-1 py-1.5 px-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              title="Choose Small, Medium, Large, or X-Large"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>{t("Select Size")}</span>
                            </button>
                            <button
                              onClick={() => setEditingPriceItem(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-orange-400 rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
                              title="Edit size prices"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleQuickAdd(item)}
                              className="flex-1 py-1.5 px-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                              title="Quick add to basket"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t("Add")}</span>
                            </button>
                            <button
                              onClick={() => setCustomizingItem(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
                              title="Customize add-ons & notes"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPriceItem(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-orange-400 rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
                              title="Edit item price"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
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
      <div className="w-full lg:w-[400px] xl:w-[430px] bg-slate-900 flex flex-col h-full shrink-0 border-t lg:border-t-0 border-slate-700 shadow-md overflow-hidden">
        {/* Ticket Header & Order Type Picker */}
        <div className="p-4 border-b border-slate-700 bg-slate-900 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-bold text-slate-100 text-base">{t("Current Ticket")}</h3>
            </div>
            {basket.length > 0 && (
              <button
                onClick={clearBasket}
                className="text-[11px] font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("Clear")}</span>
              </button>
            )}
          </div>

          {/* Order Type Buttons (Dine-In, Takeaway, Delivery) */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {[
              { type: "DINE_IN" as OrderType, label: "Dine-In", icon: Utensils },
              { type: "TAKEAWAY" as OrderType, label: "Takeaway", icon: ShoppingBag },
              { type: "DELIVERY" as OrderType, label: "Delivery", icon: Truck },
            ].map((ot) => {
              const Icon = ot.icon;
              const isSelected = orderType === ot.type;
              return (
                <button
                  key={ot.type}
                  type="button"
                  onClick={() => setOrderType(ot.type)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mb-0.5" />
                  <span>{t(ot.label)}</span>
                </button>
              );
            })}
          </div>

          {/* Customer / Reference Input */}
          <div className="space-y-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={orderType === "DELIVERY" ? t("Customer Full Name...") : (isUrdu ? "گاہک کا نام / ٹیبل نمبر..." : "Customer Name / Table #...")}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />

            {/* Delivery-Specific Details */}
            {orderType === "DELIVERY" && (
              <div className="space-y-2 pt-1.5 border-t border-slate-700 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t("Phone (e.g. 0301-4694202)")}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t("Delivery Address (Khichiwala)")}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {subtotal > 0 && subtotal < 500 ? (
                  <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center justify-between">
                    <span>⚠️ Min. Delivery Order: Rs. 500</span>
                    <span className="font-bold text-amber-200">Add {formatCurrency(500 - subtotal)} more</span>
                  </div>
                ) : subtotal >= 500 ? (
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center justify-between">
                    <span>🚚 Fast & Free Home Delivery Qualified!</span>
                    <span className="font-bold text-emerald-400">FREE</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {basket.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500">
              <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-50" />
              <p className="font-semibold text-xs text-slate-400">{t("Your basket is empty")}</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                {t("Click items on the left to add them to this order ticket.")}
              </p>
            </div>
          ) : (
            basket.map((b) => (
              <div
                key={b.cartItemId}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-1.5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="font-bold text-slate-100 text-xs truncate">
                        {b.item.name}
                      </h5>
                      {b.selectedSize && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                          {b.selectedSize}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(b.unitPrice)} each
                    </div>
                  </div>

                  {/* Quantity adjustment & Line total */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5">
                      <button
                        onClick={() => updateQuantity(b.cartItemId, -1)}
                        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-100">
                        {b.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(b.cartItemId, 1)}
                        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-16 text-right font-bold text-xs text-orange-600 dark:text-orange-400">
                      {formatCurrency(b.unitPrice * b.quantity)}
                    </div>

                    <button
                      onClick={() => removeBasketItem(b.cartItemId)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
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
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                      >
                        +{mod.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Special Instructions Note */}
                {b.notes && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    &quot;{b.notes}&quot;
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-3 shrink-0">

          {/* Line by line totals */}
          <div className="space-y-1.5 text-xs text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">{t("Subtotal:")}</span>
              <span className="text-slate-200">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>{t("Discount:")}</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">{t("Sales Tax:")}</span>
                <span className="text-slate-200">{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-700 text-base font-bold text-slate-100">
              <span>{t("Total Due:")}</span>
              <span className="text-orange-600 dark:text-orange-400 text-xl font-bold">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout / Payment Trigger Button */}
          {orderType === "DELIVERY" && basket.length > 0 && subtotal < 500 ? (
            <button
              type="button"
              disabled
              className="w-full py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
            >
              <span>{t("Min. Delivery Order Rs. 500")} ({t("Add")} {formatCurrency(500 - subtotal)})</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={basket.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:pointer-events-none active:scale-98 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{t("Proceed to Payment")}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
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

      {/* Single Item Edit Price Modal */}
      <EditPriceModal
        item={editingPriceItem}
        isOpen={!!editingPriceItem}
        onClose={() => setEditingPriceItem(null)}
        onPriceUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["menu"] });
        }}
      />

      {/* Global Product Price Manager Modal */}
      <ManagePricesModal
        isOpen={isManagePricesOpen}
        onClose={() => setIsManagePricesOpen(false)}
        items={menuItems}
        onEditItemPrice={(item) => {
          setEditingPriceItem(item);
        }}
      />
    </div>
  );
}
