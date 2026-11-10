"use client";

import React, { useState } from "react";
import { CartItem, CustomerInfo } from "@/types";
import {
  X,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onPaymentSuccess: (details: { orderId: string; captureId?: string }) => void;
  onPaymentDeclined: (details: {
    orderId: string;
    eventId?: string;
    issue?: string;
    description?: string;
    source?: string;
  }) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  onPaymentSuccess,
  onPaymentDeclined,
}: CheckoutModalProps) {
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "Alex Mercer",
    email: "alex.mercer@campus.edu",
    studentId: "STU-88421",
    university: "Tech State University",
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "created">("form");
  const [createdOrder, setCreatedOrder] = useState<{
    orderId: string;
    approvalLink: string | null;
    total: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Step 1: Create Order in PayPal Sandbox
  const handleCreateOrder = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer,
          currency: "USD",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order initialization failed");
      }

      setCreatedOrder({
        orderId: data.orderId,
        approvalLink: data.approvalLink,
        total: data.total,
      });
      setCurrentStep("created");
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Capture or Simulate Failure
  const handleExecutePayment = async (mockCode?: "INSTRUMENT_DECLINED" | "TRANSACTION_REFUSED" | "NONE") => {
    if (!createdOrder) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrder.orderId,
          mockCode: mockCode || "NONE",
        }),
      });

      const data = await res.json();

      if (res.status === 422) {
        // Declined: Intercepted by Revenue Guardian
        onPaymentDeclined({
          orderId: createdOrder.orderId,
          eventId: data.eventId,
          issue: data.issue,
          description: data.description,
          source: data.source,
        });
        onClose();
      } else if (res.ok) {
        onPaymentSuccess({
          orderId: createdOrder.orderId,
          captureId: data.captureId,
        });
        onClose();
      } else {
        throw new Error(data.error || "Capture execution failed");
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-card border border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Student Checkout</h2>
              <p className="text-xs text-gray-400">Integrated with Revenue Guardian PayPal Sandbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentStep === "form" ? (
            <>
              {/* Order Summary Pill */}
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">Total Purchase:</span>
                  <div className="text-xl font-black text-white">${total.toFixed(2)} USD</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <span>{items.reduce((s, i) => s + i.quantity, 0)} item(s)</span>
                  <p className="text-blue-400 font-medium">Student Verified</p>
                </div>
              </div>

              {/* Student Details Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Student Verification Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">University Email</label>
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Student ID #</label>
                    <input
                      type="text"
                      value={customer.studentId}
                      onChange={(e) => setCustomer({ ...customer, studentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Institution</label>
                    <input
                      type="text"
                      value={customer.university}
                      onChange={(e) => setCustomer({ ...customer, university: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCreateOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to PayPal Sandbox...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment Stage</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Order Created Notification */}
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">PayPal Sandbox Order Created</span>
                  <span className="font-mono text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded">
                    {createdOrder?.orderId}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Ready to process transaction for <strong>${createdOrder?.total} USD</strong>.
                </p>
              </div>

              {/* Real PayPal Approval Link */}
              {createdOrder?.approvalLink && (
                <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-semibold text-white">Live PayPal Sandbox Login</span>
                    <p className="text-gray-400 text-[11px]">Authorize via official PayPal Sandbox popup</p>
                  </div>
                  <a
                    href={createdOrder.approvalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <span>Approve on PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* DEMONSTRATION & FAILURE TESTING SUITE */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Live Demo: Revenue Guardian Payment Triage
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Select an execution scenario to see how Revenue Guardian in{" "}
                  <code className="text-blue-400 bg-gray-900 px-1 py-0.5 rounded">/home/lalith/Projects/PayPal</code>{" "}
                  intercepts and autonomously triages payment declines:
                </p>

                <div className="space-y-2.5">
                  {/* Scenario 1: Instrument Declined */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleExecutePayment("INSTRUMENT_DECLINED")}
                    className="w-full p-3.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-left transition-all group flex items-start justify-between disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-red-300 font-bold text-xs group-hover:text-red-200">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>Simulate Card Decline (INSTRUMENT_DECLINED)</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Simulates student debit card insufficient funds or expiry. Triggers AI triage, recovery loop & policy check.
                      </p>
                    </div>
                    <span className="text-xs text-red-400 font-bold ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Trigger →
                    </span>
                  </button>

                  {/* Scenario 2: Transaction Refused */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleExecutePayment("TRANSACTION_REFUSED")}
                    className="w-full p-3.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-left transition-all group flex items-start justify-between disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs group-hover:text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Simulate Bank Refusal (TRANSACTION_REFUSED)</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Simulates issuing bank fraud block. Intercepted by Revenue Guardian for approval triage.
                      </p>
                    </div>
                    <span className="text-xs text-amber-400 font-bold ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Trigger →
                    </span>
                  </button>

                  {/* Scenario 3: Standard Capture */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleExecutePayment("NONE")}
                    className="w-full p-3.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-left transition-all group flex items-start justify-between disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs group-hover:text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Execute Standard Capture (SUCCESS)</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Completes order capture normally without mock headers.
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Capture →
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit TLS Encrypted Sandbox</span>
          </div>
          <span className="font-mono text-[11px]">Merchant: Revenue Guardian v1.0</span>
        </div>
      </div>
    </div>
  );
}
