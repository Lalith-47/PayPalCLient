"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { Star, Check, BookOpen, ShoppingBag, Eye, Zap, Calendar, CheckCircle2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onPreviewNotes?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onPreviewNotes }: ProductCardProps) {
  const isSubscription = product.category === "subscription_notes";
  const [justAdded, setJustAdded] = useState(false);

  const handleAddClick = () => {
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl glass-card overflow-hidden hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 group">
      {/* Image Banner */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-900">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.badge && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-md shadow-md">
              {product.badge}
            </span>
          )}
          {isSubscription && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider bg-purple-600/90 text-white backdrop-blur-md shadow-md flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Subscription</span>
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-950/80 backdrop-blur-md text-xs border border-gray-800">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-white">{product.rating}</span>
          <span className="text-gray-400 text-[11px]">({product.reviewsCount})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Key Features Bullet Points */}
          <ul className="mt-3.5 space-y-1.5">
            {product.features.slice(0, 3).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing & Actions */}
        <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">${product.price.toFixed(2)}</span>
              {isSubscription && (
                <span className="text-xs text-purple-400 font-medium">
                  /{product.billingInterval === "weekly" ? "wk" : "mo"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              {isSubscription ? "Cancel anytime • Instant access" : "Free campus pickup or delivery"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSubscription && product.sampleNote && (
              <button
                type="button"
                onClick={() => onPreviewNotes && onPreviewNotes(product)}
                className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1 border border-gray-700"
                title="Preview Sample Notes & Curriculum"
              >
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddClick}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                justAdded
                  ? "bg-emerald-600 text-white shadow-emerald-600/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
              }`}
            >
              {justAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isSubscription ? "Subscribe" : "Add to Cart"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
