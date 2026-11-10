"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Loader2, Home } from "lucide-react";
import { FailureTriageModal } from "@/components/FailureTriageModal";

function ReturnContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const payerId = searchParams.get("PayerID") || "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    status: "IDLE" | "SUCCESS" | "DECLINED" | "ERROR";
    message: string;
    captureId?: string;
    eventId?: string;
  }>({
    status: "IDLE",
    message: "Connecting to PayPal Sandbox for final capture...",
  });

  const [triageData, setTriageData] = useState<{
    orderId: string;
    eventId?: string;
    issue?: string;
    description?: string;
    source?: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setResult({
        status: "ERROR",
        message: "Missing PayPal transaction token in URL.",
      });
      setLoading(false);
      return;
    }

    const capturePayment = async () => {
      try {
        const res = await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: token }),
        });

        const data = await res.json();

        if (res.ok && data.status === "COMPLETED") {
          setResult({
            status: "SUCCESS",
            message: "Transaction captured and settled successfully!",
            captureId: data.captureId,
          });
        } else if (res.status === 422 || data.status === "DECLINED") {
          setResult({
            status: "DECLINED",
            message: `Capture declined (${data.issue || "DECLINED"}). Intercepted by Revenue Guardian.`,
            eventId: data.eventId,
          });
          setTriageData({
            orderId: token,
            eventId: data.eventId,
            issue: data.issue,
            description: data.description,
            source: data.source,
          });
        } else {
          setResult({
            status: "ERROR",
            message: data.error || "Payment execution failed.",
          });
        }
      } catch (err) {
        setResult({
          status: "ERROR",
          message: (err as Error).message || "Network error completing payment.",
        });
      } finally {
        setLoading(false);
      }
    };

    capturePayment();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 rounded-3xl glass-card border border-gray-800 space-y-6 text-center">
        {loading ? (
          <div className="py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Completing PayPal Handshake</h2>
            <p className="text-xs text-gray-400">Verifying customer approval and capturing order #{token}...</p>
          </div>
        ) : result.status === "SUCCESS" ? (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">{result.message}</p>
            {result.captureId && (
              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-emerald-300">
                Capture ID: {result.captureId}
              </div>
            )}
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Return to Student Store</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Declined</h2>
            <p className="text-xs text-gray-300 max-w-sm mx-auto">{result.message}</p>

            {triageData && (
              <button
                onClick={() => setTriageData({ ...triageData })}
                className="px-5 py-2.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 text-xs font-bold transition-all"
              >
                View Revenue Guardian Recovery Triage
              </button>
            )}

            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Return to Store</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {triageData && (
        <FailureTriageModal
          isOpen={true}
          onClose={() => setTriageData(null)}
          declineData={triageData}
        />
      )}
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-xs">
          Loading checkout handshake...
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
