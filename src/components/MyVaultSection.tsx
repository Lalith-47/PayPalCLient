"use client";

import React, { useState, useEffect } from "react";
import { OwnedItem, Product } from "@/types";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  CreditCard,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface MyVaultSectionProps {
  ownedItems: OwnedItem[];
  onCancelAndRefund: (item: OwnedItem, reason: string) => Promise<void>;
  onReadNotes: (product: Product) => void;
  onExploreStore: () => void;
  refundingItemId: string | null;
  activeTab?: "active" | "returns";
  onTabChange?: (tab: "active" | "returns") => void;
  onSyncStatus?: () => Promise<void>;
  isSyncingStatus?: boolean;
}

export function MyVaultSection({
  ownedItems,
  onCancelAndRefund,
  onReadNotes,
  onExploreStore,
  refundingItemId,
  activeTab,
  onTabChange,
  onSyncStatus,
  isSyncingStatus = false,
}: MyVaultSectionProps) {
  const [internalTab, setInternalTab] = useState<"active" | "returns">("active");
  const currentTab = activeTab !== undefined ? activeTab : internalTab;
  const setTab = (tab: "active" | "returns") => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [selectedItemToRefund, setSelectedItemToRefund] = useState<OwnedItem | null>(null);
  const [refundReason, setRefundReason] = useState("Course curriculum changed / No longer needed");

  const activeItems = ownedItems.filter((i) => i.status === "ACTIVE");
  const returnedItems = ownedItems.filter(
    (i) => i.status === "REFUNDED" || i.status === "AWAITING_APPROVAL"
  );
  const pendingApprovalCount = returnedItems.filter((i) => i.status === "AWAITING_APPROVAL").length;

  const handleConfirmRefund = async () => {
    if (!selectedItemToRefund) return;
    await onCancelAndRefund(selectedItemToRefund, refundReason);
    setSelectedItemToRefund(null);
    setTab("returns");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-gray-900 to-gray-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-600/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Student Account
              </span>
              <span className="text-xs text-gray-400">
                {activeItems.length} Active • {returnedItems.length} Returned/Pending
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              My Purchases & Returned Items
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
              Manage your active college study passes, physical supplies, and check real-time return
              and refund statuses synced with payment management.
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

      {/* Segmented Control / Tabs: Main Active Section vs Returned & Refunded Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-900/80 border border-gray-800">
          {/* Main Active Purchases Section Tab */}
          <button
            type="button"
            id="tab-active-purchases"
            onClick={() => setTab("active")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === "active"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-300" />
            <span>Active Purchases & Passes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                currentTab === "active"
                  ? "bg-white text-indigo-700"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {activeItems.length}
            </span>
          </button>

          {/* Returned & Refunded Items Section Tab */}
          <button
            type="button"
            id="tab-returned-items"
            onClick={() => setTab("returns")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentTab === "returns"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "text-purple-300 hover:text-white hover:bg-gray-800/60"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
            <span>Returned & Refunded Items</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                currentTab === "returns"
                  ? "bg-white text-purple-700"
                  : "bg-purple-950/60 text-purple-300 border border-purple-500/30"
              }`}
            >
              {returnedItems.length}
            </span>
          </button>
        </div>

        {/* Live sync trigger button for payment.lalithdev.tech */}
        {onSyncStatus && (
          <button
            type="button"
            onClick={onSyncStatus}
            disabled={isSyncingStatus}
            className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            title="Poll payment.lalithdev.tech for approved refund updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingStatus ? "animate-spin" : ""}`} />
            <span>{isSyncingStatus ? "Checking Live Status..." : "Sync Status with payment.lalithdev.tech"}</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Active Items (Main Section) */}
      {currentTab === "active" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Active Owned Items & Active Subscriptions</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeItems.length} Active
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                These are items currently active in your account. If you request a return, the item will move to the Returned & Refunded section.
              </p>
            </div>
          </div>

          {activeItems.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card border border-gray-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-gray-600 mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Active Items in Your Main Vault</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {returnedItems.length > 0
                  ? "All previously purchased items have been submitted for return or refunded. Check the 'Returned & Refunded Items' tab above to review them."
                  : "You don't own any active college equipment or study passes yet. Explore the catalog to subscribe and unlock immediate access!"}
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
              {activeItems.map((item) => {
                const isSub = item.product.category === "subscription_notes";
                const isRefunding = refundingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-3xl glass-card border border-gray-800 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between space-y-5"
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

                          <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active & Owned
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base mt-1.5 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {item.product.description}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span>
                            Paid: <strong className="text-white">${item.amountPaid.toFixed(2)}</strong>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            Order: {item.orderId.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </div>

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

                      <button
                        type="button"
                        disabled={isRefunding}
                        onClick={() => setSelectedItemToRefund(item)}
                        className="ml-auto px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isRefunding ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Return...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                            <span>Cancel & Request Refund</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Returned & Refunded Section */}
      {currentTab === "returns" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Returned & Refunded Items History</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {returnedItems.length} Total
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Items moved here after cancellation or return requests. Real-time approval statuses are verified directly with payment.lalithdev.tech.
              </p>
            </div>

            {pendingApprovalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{pendingApprovalCount} Return(s) Awaiting Merchant Review</span>
              </div>
            )}
          </div>

          {returnedItems.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card border border-gray-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-gray-600 mx-auto">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Returned or Refunded Items</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                You have not requested returns on any purchases. All your current items remain active in the "Active Purchases & Passes" section.
              </p>
              <button
                onClick={() => setTab("active")}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                View Active Purchases
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {returnedItems.map((item) => {
                const isSub = item.product.category === "subscription_notes";
                const isRefunded = item.status === "REFUNDED";
                const isPending = item.status === "AWAITING_APPROVAL";

                return (
                  <div
                    key={item.id}
                    className={`p-6 rounded-3xl glass-card border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                      isRefunded
                        ? "border-purple-500/40 bg-purple-950/15"
                        : "border-amber-500/40 bg-amber-950/15"
                    }`}
                  >
                    {/* Item Card Top */}
                    <div className="flex gap-4 items-start">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-2xl object-cover bg-gray-900 shrink-0 opacity-80"
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
                            className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider ${
                              isRefunded
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {isRefunded ? "Refund Approved & Settled" : "Pending Merchant Review"}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base mt-1.5 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {item.product.description}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span>
                            Amount:{" "}
                            <strong className="text-white">${item.amountPaid.toFixed(2)}</strong>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            Order: {item.orderId.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Refund Details Banner */}
                    {isRefunded && (
                      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Amount Refunded: ${item.amountPaid.toFixed(2)} USD</span>
                          </span>
                          <span className="text-[10px] font-mono text-purple-300 uppercase">
                            PayPal Settled
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-200 leading-relaxed">
                          {item.refundMessage ||
                            `Refund of $${item.amountPaid.toFixed(2)} was successfully approved and credited back to your original payment method via PayPal.`}
                        </p>
                      </div>
                    )}

                    {isPending && (
                      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-bold text-amber-300">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>Return Request Submitted: ${item.amountPaid.toFixed(2)} USD</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-300">
                            Awaiting Manager Review
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          {item.refundMessage ||
                            `Your refund request of $${item.amountPaid.toFixed(2)} is currently queued for merchant approval on payment.lalithdev.tech.`}
                        </p>
                        {onSyncStatus && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={onSyncStatus}
                              disabled={isSyncingStatus}
                              className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 text-amber-300 ${
                                  isSyncingStatus ? "animate-spin" : ""
                                }`}
                              />
                              <span>Check Approval Status</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                  <h3 className="font-bold text-white text-base">Confirm Return & Refund</h3>
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
                <span>Credit Destination:</span>
                <span className="text-emerald-400 font-semibold">Original PayPal Account</span>
              </div>
              <p className="pt-2 border-t border-gray-800 text-[11px] text-gray-400">
                This item will move from your Active Purchases into the Returned & Refunded section. Your refund will be credited directly to your PayPal account.
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason for Return</label>
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
                Submit Return & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
