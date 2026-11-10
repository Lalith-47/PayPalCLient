"use client";

import React from "react";
import { CartItem } from "@/types";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, Calendar } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  isGeneratingInvoice?: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  isGeneratingInvoice = false,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasSubscriptions = items.some((item) => item.product.category === "subscription_notes");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-gray-950 border-l border-gray-800 flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/40">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Your Student Cart</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-gray-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-semibold text-white">Your cart is empty</p>
              <p className="text-xs text-gray-500 max-w-xs">
                Browse our college essentials and subscription notes passes to get started!
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isSub = item.product.category === "subscription_notes";
              return (
                <div
                  key={item.product.id}
                  className="p-4 rounded-2xl glass-card border border-gray-800 flex gap-3.5 items-center group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isSub && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 rounded uppercase">
                          Pass
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.product.name}
                      </h4>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-sm font-black text-blue-400">
                        ${item.product.price.toFixed(2)}
                      </span>
                      {isSub && (
                        <span className="text-[10px] text-gray-400">/mo</span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg bg-gray-900 border border-gray-800">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:text-white text-gray-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:text-white text-gray-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors ml-auto"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-800 bg-gray-950/90 space-y-4">
            {hasSubscriptions && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-2 text-xs text-purple-300">
                <Calendar className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Includes recurring student subscription(s). Managed via PayPal.</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Student Tax Exemption</span>
                <span className="text-emerald-400 font-semibold">$0.00</span>
              </div>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-sm font-bold text-white">
                <span>Total Due Now</span>
                <span className="text-xl font-black text-blue-400">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              disabled={isGeneratingInvoice}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
            >
              {isGeneratingInvoice ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PayPal Invoice...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
