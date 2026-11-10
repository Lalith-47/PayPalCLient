"use client";

import React from "react";
import { Product } from "@/types";
import { X, BookOpen, FileText, CheckCircle2, ShoppingBag, ShieldCheck } from "lucide-react";

interface NotesPreviewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function NotesPreviewModal({
  product,
  onClose,
  onAddToCart,
}: NotesPreviewModalProps) {
  if (!product || !product.sampleNote) return null;
  const { sampleNote } = product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-500/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-950/60 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {sampleNote.format} • {sampleNote.subject}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{sampleNote.title}</h2>
              <p className="text-xs text-gray-400">
                {sampleNote.pageCount} pages • High-yield verified professor notes
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Topics Covered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Core Curriculum & Topics Covered</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleNote.topics.map((t, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-200 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Snippet / Theorem */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Sample Excerpt from Vault</span>
            </h4>
            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
              <p className="whitespace-pre-wrap">{sampleNote.sampleExcerpt}</p>
            </div>
          </div>

          {/* Features in this Subscription */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-500/20 text-xs space-y-2">
            <div className="font-semibold text-purple-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Included with your ${product.price.toFixed(2)}/mo Student Pass:</span>
            </div>
            <p className="text-gray-300">
              Immediate full access to all lecture slides, textbook solution manuals, past exam papers with step-by-step solutions, and digital Anki decks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-white">
              ${product.price.toFixed(2)}
              <span className="text-xs text-purple-400 font-normal">/month</span>
            </div>
            <p className="text-[11px] text-gray-400">Billed monthly • Cancel anytime</p>
          </div>
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Subscription to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
