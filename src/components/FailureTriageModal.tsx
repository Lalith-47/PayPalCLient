"use client";

import React, { useState, useEffect } from "react";
import { RevenueGuardianEvent } from "@/types";
import {
  AlertTriangle,
  ShieldAlert,
  Bot,
  Cpu,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  CreditCard,
} from "lucide-react";

interface FailureTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  declineData: {
    orderId: string;
    eventId?: string;
    issue?: string;
    description?: string;
    source?: string;
  } | null;
  onRetryPayment?: () => void;
}

export function FailureTriageModal({
  isOpen,
  onClose,
  declineData,
  onRetryPayment,
}: FailureTriageModalProps) {
  const [eventDetails, setEventDetails] = useState<RevenueGuardianEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const eventId = declineData?.eventId;

  // Poll event triage details from Revenue Guardian API
  const fetchTriage = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.event) {
          setEventDetails(data.event);
        }
      }
    } catch (err) {
      console.warn("Polling event details failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !eventId) return;

    fetchTriage();
    const interval = setInterval(() => {
      setPollCount((prev) => prev + 1);
      fetchTriage();
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, eventId]);

  if (!isOpen || !declineData) return null;

  const currentStatus = eventDetails?.status || "RECEIVED";
  const proposal = eventDetails?.proposal;
  const action = eventDetails?.action;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl glass-card border border-red-500/40 overflow-hidden shadow-2xl shadow-red-500/20 flex flex-col max-h-[92vh]">
        {/* Header Alert */}
        <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-red-950/70 via-gray-950 to-gray-950 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-600/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                  Payment Intercepted & Triaged
                </span>
                <span className="text-xs text-gray-400">Order #{declineData.orderId}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Decline Detected: {declineData.issue || "INSTRUMENT_DECLINED"}
              </h2>
              <p className="text-xs text-gray-300">
                {declineData.description || "The instrument presented was declined by the processor or bank."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: The Revenue Guardian Recovery Mechanism */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Revenue Guardian Live Pipeline Card */}
          <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Revenue Guardian Management Loop (/home/lalith/Projects/PayPal)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {loading && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentStatus === "EXECUTED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : currentStatus === "PROPOSED"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : currentStatus === "WAITING_FOR_APPROVAL"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}
                >
                  Status: {currentStatus}
                </span>
              </div>
            </div>

            {/* Event ID Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Event Reference</span>
                <span className="font-mono text-gray-200 truncate block mt-0.5">
                  {eventId || "Enqueuing..."}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Event Type</span>
                <span className="text-gray-200 block mt-0.5 font-medium">payment.capture_declined</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Detection Origin</span>
                <span className="text-blue-400 block mt-0.5 font-medium">
                  {declineData.source || "sandbox_negative_testing"}
                </span>
              </div>
            </div>
          </div>

          {/* Three-Tier Guardrails Architecture Display */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Autonomous Triage Architecture: "AI Proposes, Code Decides, Executor Acts"
            </h4>

            {/* Tier 1: AI Proposal */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                    1
                  </div>
                  <span className="text-xs font-bold text-white">AI Decision Agent (OpenRouter LLM)</span>
                </div>
                {proposal && (
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30">
                    Confidence: {(parseFloat(proposal.confidence) * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {proposal ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-400">Proposed Strategy:</span>
                    <span className="font-bold uppercase text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded">
                      {proposal.action}
                    </span>
                    <span className="text-[11px] text-gray-500">via {proposal.modelUsed || "Nemotron LLM"}</span>
                  </div>
                  <p className="text-gray-300 bg-gray-950 p-2.5 rounded-xl border border-gray-800 font-mono text-[11px]">
                    "{proposal.reasoning}"
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400 p-2.5 rounded-xl bg-gray-950">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>AI Agent formulating structured recovery proposal from failure context...</span>
                </div>
              )}
            </div>

            {/* Tier 2: Deterministic Policy Engine */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
                    2
                  </div>
                  <span className="text-xs font-bold text-white">
                    Deterministic Policy Engine (TypeScript Guardrails)
                  </span>
                </div>
                <span className="text-[11px] text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                  Zero I/O • Fail-Closed
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Evaluates proposal strictly against store policy:
                <span className="text-purple-300 font-medium"> max retry attempts (2)</span>,
                <span className="text-purple-300 font-medium"> confidence threshold (80%)</span>, and
                <span className="text-purple-300 font-medium"> currency match (USD)</span>.
              </p>
            </div>

            {/* Tier 3: Execution & Cryptographic Ledger */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    3
                  </div>
                  <span className="text-xs font-bold text-white">Idempotent Execution & Immutable Audit</span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  SHA-256 Keyed
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {action ? (
                  <span>
                    Action <code className="text-emerald-400 font-mono">{action.actionType}</code> marked as{" "}
                    <strong>{action.status}</strong> with idempotency protection.
                  </span>
                ) : (
                  <span>
                    Triage result recorded into the PostgreSQL audit ledger. Over-limit actions route to the
                    Approvals Inbox with single-use cryptographic token.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Nav to Merchant Backend */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-white block">View this in the Merchant Dashboard</span>
              <span className="text-gray-400 text-[11px]">
                Inspect the live AG Grid events, policy approvals inbox, and audit logs.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="http://localhost:3000/events"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>Live Events</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="http://localhost:3000/approvals"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-gray-700 transition-all"
              >
                <span>Approvals</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions for Customer */}
        <div className="p-6 border-t border-gray-800 bg-gray-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            Payment issue intercepted. No funds were debited from your account.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onClose();
                if (onRetryPayment) onRetryPayment();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Retry with Alternate Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
