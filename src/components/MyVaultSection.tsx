"use client";

import React, { useState } from "react";
import { OwnedItem, Product } from "@/types";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Layers,
  Calendar,
  XCircle,
  Loader2,
  RefreshCw,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  CreditCard,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface MyVaultSectionProps {
  ownedItems: OwnedItem[];
  onCancelAndRefund: (item: OwnedItem, reason: string) => Promise<void>;
  onBatchRefund?: (items: OwnedItem[], reason: string) => Promise<void>;
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
  onBatchRefund,
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

  // Grouping state for multi-item returns
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("Course curriculum changed / No longer needed");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Active items (items currently owned and NOT refunded)
  const activeItems = ownedItems.filter((i) => i.status === "ACTIVE");

  // Returned items (ONLY items that have been put for refund or completed refund)
  const returnedItems = ownedItems.filter(
    (i) => i.status === "REFUNDED" || i.status === "AWAITING_APPROVAL"
  );
  const pendingApprovalCount = returnedItems.filter((i) => i.status === "AWAITING_APPROVAL").length;

  // Selected group items
  const selectedItems = activeItems.filter((i) => selectedItemIds.includes(i.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.amountPaid, 0);

  // Toggle selection of a single active item
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all or Deselect all active items
  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === activeItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(activeItems.map((i) => i.id));
    }
  };

  // Open group return modal with a single item
  const handleOpenSingleReturn = (item: OwnedItem) => {
    if (!selectedItemIds.includes(item.id)) {
      setSelectedItemIds([item.id]);
    }
    setIsGroupModalOpen(true);
  };

  // Open group return modal for current selection
  const handleOpenGroupReturn = () => {
    if (selectedItems.length === 0) return;
    setIsGroupModalOpen(true);
  };

  // Confirm and submit refund for the whole group at once
  const handleConfirmGroupRefund = async () => {
    if (selectedItems.length === 0) return;
    setIsSubmittingGroup(true);
    try {
      if (onBatchRefund) {
        await onBatchRefund(selectedItems, refundReason);
      } else {
        for (const item of selectedItems) {
          await onCancelAndRefund(item, refundReason);
        }
      }
      setSelectedItemIds([]);
      setIsGroupModalOpen(false);
      setTab("returns");
    } finally {
      setIsSubmittingGroup(false);
    }
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
              Group active items you wish to return and submit all at once. Check real-time refund
              statuses synchronized directly with store payment management.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 text-xs space-y-1.5 shrink-0">
          <span className="font-bold text-gray-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Student Purchase Guarantee</span>
          </span>
          <p className="text-gray-400 text-[11px]">
            • Group multiple purchases and return together at once
          </p>
          <p className="text-gray-400 text-[11px]">
            • Instant automated refund or direct store management review
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
            id="btn-sync-refund-status"
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

      {/* SECTION 1: Active Items (Main Section) with Group Return Feature */}
      {currentTab === "active" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Active Owned Items & Passes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeItems.length} Active
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Select items you wish to return together, then click <strong>Request Return for Group</strong>.
              </p>
            </div>
          </div>

          {activeItems.length > 0 && (
            /* Group Action Bar */
            <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="btn-toggle-select-all"
                  onClick={handleToggleSelectAll}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-2 border border-gray-700"
                >
                  {selectedItemIds.length === activeItems.length && activeItems.length > 0 ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-gray-400" />
                      <span>Select All ({activeItems.length})</span>
                    </>
                  )}
                </button>

                <div className="text-xs">
                  {selectedItemIds.length === 0 ? (
                    <span className="text-gray-400">Check items below to group for return</span>
                  ) : (
                    <span className="text-gray-300">
                      <strong className="text-indigo-400 font-bold">{selectedItemIds.length}</strong> of {activeItems.length} selected{" "}
                      (<strong className="text-white">${selectedTotal.toFixed(2)} USD</strong>)
                    </span>
                  )}
                </div>
              </div>

              {/* Group Return Submit Button */}
              <button
                type="button"
                id="btn-group-refund"
                disabled={selectedItemIds.length === 0 || isSubmittingGroup || refundingItemId === "batch"}
                onClick={handleOpenGroupReturn}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedItemIds.length > 0
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
                    : "bg-gray-800/80 text-gray-500 border border-gray-800 cursor-not-allowed opacity-60"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {selectedItemIds.length === 0
                    ? "Select Items to Group & Return"
                    : `Request Return for Group (${selectedItemIds.length} • $${selectedTotal.toFixed(2)})`}
                </span>
              </button>
            </div>
          )}

          {activeItems.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card border border-gray-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-gray-600 mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Active Items in Your Main Vault</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {returnedItems.length > 0
                  ? "All previously purchased items have been submitted for return or refunded. Review them in the 'Returned & Refunded Items' tab above."
                  : "You don't own any active college equipment or study passes yet. Explore the catalog to subscribe and unlock immediate access!"}
              </p>
              <button
                type="button"
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
                const isSelected = selectedItemIds.includes(item.id);
                const isRefunding = refundingItemId === item.id || (refundingItemId === "batch" && isSelected);

                return (
                  <div
                    key={item.id}
                    className={`p-6 rounded-3xl glass-card border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                      isSelected
                        ? "border-indigo-500/80 bg-indigo-950/20 shadow-lg shadow-indigo-500/10"
                        : "border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    {/* Top Group Selection Toggle Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white group cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                              : "bg-gray-900 border-gray-700 group-hover:border-indigo-500/60 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className={`font-medium ${isSelected ? "text-indigo-300 font-bold" : "text-gray-400 group-hover:text-gray-200"}`}>
                          {isSelected ? "Grouped for return" : "Select for return"}
                        </span>
                      </button>

                      <span className="font-bold text-xs text-white bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                        ${item.amountPaid.toFixed(2)} USD
                      </span>
                    </div>

                    {/* Item Card Body */}
                    <div className="flex gap-4 items-start">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-2xl object-cover bg-gray-900 shrink-0 border border-gray-800"
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
                        onClick={() => handleOpenSingleReturn(item)}
                        className={`ml-auto px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                          isSelected
                            ? "bg-indigo-900/40 border-indigo-500/50 text-indigo-200"
                            : "bg-red-950/40 hover:bg-red-900/50 border-red-500/30 text-red-300 hover:text-red-200"
                        }`}
                      >
                        {isRefunding ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Return...</span>
                          </>
                        ) : isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                            <span>In Return Group</span>
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
                Only items submitted for return appear here. Real-time refund statuses are synchronized with store payment management.
              </p>
            </div>

            {pendingApprovalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{pendingApprovalCount} Return(s) Awaiting Store Review</span>
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
                type="button"
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
                        ? "border-emerald-500/30 bg-emerald-950/10"
                        : "border-amber-500/30 bg-amber-950/10"
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
                              <span>Notes Pass</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 rounded-md flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>Gear</span>
                            </span>
                          )}

                          {isRefunded && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Refund Approved & Settled</span>
                            </span>
                          )}

                          {isPending && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Awaiting Management Review</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-white text-base mt-1.5 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {item.product.description}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span>
                            Original: <span className="line-through text-gray-400">${item.amountPaid.toFixed(2)}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            Order: {item.orderId.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Refund Banner Details */}
                    <div
                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                        isRefunded
                          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                          : "bg-amber-950/30 border-amber-500/30 text-amber-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          {isRefunded ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Amount Refunded: ${item.amountPaid.toFixed(2)} USD</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-amber-400" />
                              <span>Requested Refund: ${item.amountPaid.toFixed(2)} USD</span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300">
                          PayPal Direct Credit
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        {item.refundMessage ||
                          (isRefunded
                            ? `Refund of $${item.amountPaid.toFixed(2)} USD was approved and returned to your PayPal account.`
                            : `Return request is awaiting review by store management on payment.lalithdev.tech.`)}
                      </p>
                    </div>

                    {/* Pending sync check */}
                    {isPending && onSyncStatus && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={onSyncStatus}
                          disabled={isSyncingStatus}
                          className="px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 text-amber-400 ${isSyncingStatus ? "animate-spin" : ""}`} />
                          <span>Check Approval Status</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Group Return Confirmation Modal */}
      {isGroupModalOpen && selectedItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl glass-card border border-red-500/40 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedItems.length > 1
                      ? "Confirm Group Return Request"
                      : "Confirm Return & Refund"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedItems.length > 1
                      ? `${selectedItems.length} item(s) grouped for return`
                      : selectedItems[0]?.product.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Itemized List of Selected Purchases */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-900/90 border border-gray-800 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-xl object-cover bg-gray-950 shrink-0 border border-gray-800"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Order #{item.orderId.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-white shrink-0">
                    ${item.amountPaid.toFixed(2)} USD
                  </span>
                </div>
              ))}
            </div>

            {/* Refund Financial Summary */}
            <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Total Items:</span>
                <span className="font-bold text-white">{selectedItems.length} item(s)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total Refund Amount:</span>
                <span className="font-black text-white text-sm">
                  ${selectedTotal.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Credit Destination:</span>
                <span className="text-emerald-400 font-semibold">Original PayPal Account</span>
              </div>
              <p className="pt-2 border-t border-gray-800 text-[11px] text-gray-400">
                All selected items will move from Active Purchases into the Returned & Refunded section upon submission.
              </p>
            </div>

            {/* Return Reason Selector */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Reason for Return
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Course curriculum changed / No longer needed">
                  Course curriculum changed / No longer needed
                </option>
                <option value="Accidentally purchased duplicate">
                  Accidentally purchased duplicate
                </option>
                <option value="Materials no longer required for semester">
                  Materials no longer required for semester
                </option>
                <option value="Incorrect textbook edition or gear">
                  Incorrect textbook edition or gear
                </option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingGroup}
                onClick={() => setIsGroupModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Keep Items
              </button>
              <button
                type="button"
                id="btn-confirm-group-refund"
                disabled={isSubmittingGroup}
                onClick={handleConfirmGroupRefund}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingGroup ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Return...</span>
                  </>
                ) : (
                  <span>
                    {selectedItems.length > 1
                      ? `Submit Return & Refund (${selectedItems.length} items • $${selectedTotal.toFixed(2)})`
                      : "Submit Return & Refund"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
