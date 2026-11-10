"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Layers,
  Archive,
} from "lucide-react";

interface HeaderProps {
  cartCount: number;
  ownedCount: number;
  onOpenCart: () => void;
  currentView: "store" | "vault";
  onSelectView: (view: "store" | "vault") => void;
  activeCategory: "all" | "essentials" | "subscription_notes";
  onSelectCategory: (cat: "all" | "essentials" | "subscription_notes") => void;
}

export function Header({
  cartCount,
  ownedCount,
  onOpenCart,
  currentView,
  onSelectView,
  activeCategory,
  onSelectCategory,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            onClick={() => onSelectView("store")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">CampusVault</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Student Store
                </span>
              </div>
              <p className="text-xs text-gray-400">College Supplies & Academic Notes Subscriptions</p>
            </div>
          </div>

          {/* Navigation Views & Categories */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-900/60 p-1.5 rounded-2xl border border-gray-800">
            {/* Store View */}
            <button
              onClick={() => {
                onSelectView("store");
                onSelectCategory("all");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === "store" && activeCategory === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => {
                onSelectView("store");
                onSelectCategory("essentials");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === "store" && activeCategory === "essentials"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Supplies</span>
            </button>
            <button
              onClick={() => {
                onSelectView("store");
                onSelectCategory("subscription_notes");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === "store" && activeCategory === "subscription_notes"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-pink-400" />
              <span>Notes Passes</span>
            </button>

            {/* My Vault View */}
            <button
              onClick={() => onSelectView("vault")}
              className={`ml-1 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentView === "vault"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-purple-300 hover:text-white hover:bg-purple-950/40"
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>My Vault & Subscriptions</span>
              {ownedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-white text-purple-700 font-black rounded-full">
                  {ownedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Revenue Guardian Approvals & Portal Link */}
            <a
              href="http://localhost:3000/approvals"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-amber-500/50 transition-all group"
              title="Inspect Approvals Inbox on payment.lalithdev.tech"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Approvals Inbox</span>
              <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-amber-400" />
            </a>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full bg-white text-blue-600 text-xs font-black flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
