"use client";

import React, { useState } from "react";
import { InvoiceDetails } from "@/types";
import {
  FileText,
  ExternalLink,
  CreditCard,
  XCircle,
  AlertTriangle,
  Building2,
  GraduationCap,
  Calendar,
  Lock,
  Loader2,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface InvoiceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetails | null;
  onConfirmSettlement: () => void;
  onCancel: () => void;
  onSimulateDecline?: () => void;
  loadingPayment: boolean;
}

export function InvoiceViewerModal({
  isOpen,
  onClose,
  invoice,
  onConfirmSettlement,
  onCancel,
  onSimulateDecline,
  loadingPayment,
}: InvoiceViewerModalProps) {
  const [openedPayPal, setOpenedPayPal] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePayNowClick = () => {
    // Open the PayPal hosted invoice in a new tab
    if (invoice.payerViewUrl) {
      window.open(invoice.payerViewUrl, "_blank", "noopener,noreferrer");
      setOpenedPayPal(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-card border border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PayPal Invoice
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  #{invoice.invoiceNumber}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Student Invoice Details
              </h2>
              <p className="text-xs text-gray-400">
                Issued by <span className="text-blue-400 font-medium">{invoice.merchant.domain}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Active Guidance if PayPal Invoice was opened */}
          {openedPayPal ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 text-blue-200 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PayPal Hosted Invoice Opened in New Tab</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Complete your payment in the official PayPal Sandbox window, then click{" "}
                <strong className="text-white">"Confirm Settlement & Claim Ownership"</strong> below to add items to your Vault.
              </p>
              <div className="pt-1">
                <a
                  href={invoice.payerViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Re-open PayPal Invoice page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            /* Merchant & Customer Grid */
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Merchant</span>
                </span>
                <p className="font-bold text-white text-sm">{invoice.merchant.name}</p>
                <p className="text-gray-400 font-mono text-[11px]">{invoice.merchant.domain}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Student</span>
                </span>
                <p className="font-bold text-white text-sm">{invoice.customer.name}</p>
                <p className="text-gray-300">{invoice.customer.email}</p>
              </div>
            </div>
          )}

          {/* Itemized Line Items Table */}
          <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-950">
            <div className="bg-gray-900/80 px-4 py-2 border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400 grid grid-cols-12 gap-2">
              <div className="col-span-8">Description</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            <div className="divide-y divide-gray-800/80 max-h-48 overflow-y-auto">
              {invoice.lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-gray-900/40 transition-colors"
                >
                  <div className="col-span-8 pr-2">
                    <span className="font-semibold text-white block truncate">{item.description}</span>
                    {item.isSubscription && (
                      <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold bg-purple-500/20 text-purple-300 rounded">
                        Notes Subscription Pass
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-center font-mono text-gray-300">
                    {item.quantity}
                  </div>
                  <div className="col-span-3 text-right font-black text-white">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Due */}
            <div className="bg-gray-900/60 p-4 border-t border-gray-800 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-gray-300">Total Due (USD)</span>
              <span className="text-2xl font-black text-blue-400">
                ${invoice.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Strictly Pay Now or Cancel */}
        <div className="p-5 border-t border-gray-800 bg-gray-950/90 space-y-3">
          <div className="flex items-center gap-3">
            {/* Cancel Button */}
            <button
              type="button"
              disabled={loadingPayment}
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-gray-400" />
              <span>Cancel</span>
            </button>

            {/* Pay Now Button / Confirm Settlement Button */}
            {openedPayPal ? (
              <button
                type="button"
                disabled={loadingPayment}
                onClick={onConfirmSettlement}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {loadingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Settlement & Claim</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={loadingPayment}
                onClick={handlePayNowClick}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Now</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
              </button>
            )}
          </div>

          {/* Optional Demo Failure Simulation link for demonstrating Revenue Guardian */}
          {onSimulateDecline && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onSimulateDecline}
                className="text-[11px] text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <AlertTriangle className="w-3 h-3 text-red-500/80" />
                <span>Demonstration Mode: Test How Payment Failure is Triaged</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
