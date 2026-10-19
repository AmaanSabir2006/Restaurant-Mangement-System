"use client";

import React from "react";
import { OrderDto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Printer, Check, X, Flame } from "lucide-react";

interface ReceiptModalProps {
  order: OrderDto;
  tenderAmount?: number;
  change?: number;
  onClose: () => void;
  onNewOrder: () => void;
}

export default function ReceiptModal({
  order,
  tenderAmount,
  change,
  onClose,
  onNewOrder,
}: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden in print) */}
        <div className="no-print flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-white text-sm">Receipt Preview (80mm Thermal)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-950">
          {/* Thermal Receipt Paper Canvas */}
          <div
            id="thermal-receipt-print-area"
            className="w-full max-w-[320px] bg-white text-black p-5 rounded-sm shadow-xl font-mono text-xs leading-relaxed select-text"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-400">
              <div className="flex items-center justify-center gap-1.5 font-black text-base tracking-tighter">
                <Flame className="w-5 h-5 text-neutral-800 fill-neutral-800" />
                <span>BURGERCRAFT</span>
              </div>
              <p className="text-[10px] text-neutral-600 uppercase font-sans mt-0.5">
                Artisan Fast Food & Grill
              </p>
              <p className="text-[10px] text-neutral-600 mt-1">
                Main Boulevard, Gulberg III, Lahore, Pakistan
              </p>
              <p className="text-[10px] text-neutral-600">Tel: +92 (42) 3578-9000</p>
            </div>

            {/* Order Details Header */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 text-[11px] space-y-1">
              <div className="flex justify-between font-bold">
                <span>ORDER #{order.orderNumber}</span>
                <span className="uppercase px-1.5 py-0.2 bg-neutral-200 rounded text-[10px]">
                  {order.orderType.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600 text-[10px]">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between text-neutral-700 text-[10px]">
                  <span>Customer:</span>
                  <span className="font-semibold">{order.customerName}</span>
                </div>
              )}
              {order.employee?.name && (
                <div className="flex justify-between text-neutral-600 text-[10px]">
                  <span>Cashier:</span>
                  <span>{order.employee.name}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-neutral-400 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-neutral-500">
                <span>Item</span>
                <span>Total</span>
              </div>

              {order.items?.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold">
                      {item.quantity}x {item.menuItem?.name || "Item"}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-4 text-[10px] text-neutral-600 space-y-0.2">
                      {item.modifiers.map((m, mIdx) => (
                        <div key={mIdx} className="flex justify-between">
                          <span>+ {m.name}</span>
                          {m.price > 0 && <span>{formatCurrency(m.price)}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Item kitchen note */}
                  {item.notes && (
                    <div className="pl-4 text-[10px] italic text-neutral-500">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals Calculation */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>Discount Promo:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-700">
                <span>Sales Tax (8%):</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>

              {order.serviceCharge > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>Service Charge:</span>
                  <span>{formatCurrency(order.serviceCharge)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-dotted border-neutral-300">
                <span>TOTAL:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Audit */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>
              {tenderAmount !== undefined && (
                <div className="flex justify-between">
                  <span>Tendered:</span>
                  <span>{formatCurrency(tenderAmount)}</span>
                </div>
              )}
              {change !== undefined && (
                <div className="flex justify-between font-semibold">
                  <span>Change Given:</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Status:</span>
                <span className="text-emerald-700 font-bold uppercase">PAID / APPROVED</span>
              </div>
            </div>

            {/* Barcode & Footer Promo */}
            <div className="pt-3 text-center space-y-2">
              {/* Simulated barcode */}
              <div className="flex justify-center items-center gap-[2px] h-8 px-4 opacity-80">
                {[
                  3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 1, 2,
                  3, 1, 4, 2,
                ].map((w, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${w}px` }}
                    className="h-full bg-black shrink-0"
                  />
                ))}
              </div>
              <p className="text-[9px] text-neutral-500 font-mono tracking-widest">
                * {order.id.slice(-10).toUpperCase()} *
              </p>
              <p className="text-[10px] text-neutral-600 italic">
                Thank you for your visit! Share feedback at burgercraft.io/win for a free shake!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (hidden in print) */}
        <div className="no-print p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close Preview
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={onNewOrder}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Start New Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
