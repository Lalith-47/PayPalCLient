"use client";

import React, { useState } from "react";
import { OwnedItem, Product } from "@/types";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";

interface MyVaultSectionProps {
  ownedItems: OwnedItem[];
  onCancelAndRefund: (item: OwnedItem, reason: string) => Promise<void>;
  onReadNotes: (product: Product) => void;
  onExploreStore: () => void;
  refundingItemId: string | null;
}

export function MyVaultSection({
  ownedItems,
  onCancelAndRefund,
  onReadNotes,
  onExploreStore,
  refundingItemId,
}: MyVaultSectionProps) {
  const [selectedItemToRefund, setSelectedItemToRefund] = useState<OwnedItem | null>(null);
  const [refundReason, setRefundReason] = useState("Course curriculum changed / No longer needed");

  const handleConfirmRefund = async () => {
    if (!selectedItemToRefund) return;
    await onCancelAndRefund(selectedItemToRefund, refundReason);
    setSelectedItemToRefund(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-gray-900 to-gray-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-600/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Student Vault
              </span>
              <span className="text-xs text-gray-400">
                {ownedItems.filter((i) => i.status === "ACTIVE").length} Active Subscription(s) & Gear
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              My Owned Items & Subscriptions
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
              Access your full study vaults, lecture cheat sheets, and physical campus supplies.
              View your owned materials or submit return requests below.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 text-xs space-y-1.5 shrink-0">
          <span className="font-bold text-gray-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Student Purchase Guarantee</span>
          </span>
          <p className="text-gray-400 text-[11px]">
            • 30-day money-back guarantee on all courses
          </p>
          <p className="text-gray-400 text-[11px]">
            • Verified settlement & fast return processing
          </p>
        </div>
      </div>

      {/* Owned Items List */}
      {ownedItems.length === 0 ? (
        <div className="p-12 rounded-3xl glass-card border border-gray-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-gray-600 mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Your Vault is Empty</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            You don't own any college equipment or subscription study notes passes yet.
            Explore the catalog to subscribe and unlock immediate access!
          </p>
          <button
            onClick={onExploreStore}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            Browse College Supplies & Notes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ownedItems.map((item) => {
            const isSub = item.product.category === "subscription_notes";
            const isRefunding = refundingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl glass-card border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                  item.status === "ACTIVE"
                    ? "border-gray-800 hover:border-indigo-500/40"
                    : item.status === "REFUNDED"
                    ? "border-purple-500/30 bg-purple-950/10"
                    : "border-amber-500/30 bg-amber-950/10"
                }`}
              >
                {/* Item Card Top */}
                <div className="flex gap-4 items-start">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-gray-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isSub ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded-md flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Subscription Pass</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 rounded-md flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Physical Gear</span>
                        </span>
                      )}

                      {/* Status Tag */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : item.status === "REFUNDED"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {item.status === "ACTIVE"
                          ? "Active & Owned"
                          : item.status === "REFUNDED"
                          ? "Refunded"
                          : "Approval Pending"}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mt-1.5 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {item.product.description}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>Paid: <strong className="text-white">${item.amountPaid.toFixed(2)}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">Order: {item.orderId.slice(0, 10)}...</span>
                    </div>
                  </div>
                </div>

                {/* Refund Status Message Banner */}
                {item.status === "REFUNDED" && (
                  <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-purple-300">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      <span>Refund Approved & Settled</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Refund of ${item.amountPaid.toFixed(2)} was successfully processed and credited to your original payment method.
                    </p>
                  </div>
                )}

                {item.status === "AWAITING_APPROVAL" && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Pending Merchant Approval</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Your return request of <strong>${item.amountPaid.toFixed(2)}</strong> has been submitted. Our support team is currently reviewing it and will notify you once processed.
                    </p>
                  </div>
                )}

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-3">
                  {isSub && item.product.sampleNote && (
                    <button
                      type="button"
                      onClick={() => onReadNotes(item.product)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Read Full Notes Vault</span>
                    </button>
                  )}

                  {item.status === "ACTIVE" && (
                    <button
                      type="button"
                      disabled={isRefunding}
                      onClick={() => setSelectedItemToRefund(item)}
                      className="ml-auto px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isRefunding ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating Policy...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                          <span>Cancel & Request Refund</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {selectedItemToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl glass-card border border-red-500/40 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Confirm Cancellation</h3>
                  <p className="text-xs text-gray-400">{selectedItemToRefund.product.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemToRefund(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Refund Amount:</span>
                <span className="font-black text-white text-sm">
                  ${selectedItemToRefund.amountPaid.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Credit Method:</span>
                <span className="text-emerald-400 font-semibold">Original PayPal Account</span>
              </div>
              <p className="pt-2 border-t border-gray-800 text-[11px] text-gray-400">
                Returns are evaluated and credited back to your original payment method. You will receive an immediate confirmation once submitted.
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason for Cancellation</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemToRefund(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                Submit Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

