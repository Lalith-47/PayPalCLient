import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PRODUCTS } from "@/data/products";
import { seedProductsIfEmpty } from "@/db/seed";
import { Product, BillingInterval } from "@/types";

export async function GET() {
  if (!db) {
    // If no DATABASE_URL configured yet, return fallback data
    return NextResponse.json({ products: PRODUCTS, source: "in_memory_fallback" });
  }

  try {
    await seedProductsIfEmpty();

    const rows = await db.select().from(products);
    if (rows.length === 0) {
      return NextResponse.json({ products: PRODUCTS, source: "in_memory_fallback" });
    }

    const mappedProducts: Product[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as "essentials" | "subscription_notes",
      price: parseFloat(r.price),
      billingInterval: r.billingInterval as BillingInterval,
      description: r.description,
      badge: r.badge || undefined,
      features: (r.features as string[]) || [],
      rating: r.rating ? parseFloat(r.rating) : 4.8,
      reviewsCount: r.reviewsCount || 0,
      image: r.image,
      inStock: r.inStock,
      sampleNote: r.sampleNote || undefined,
    }));

    return NextResponse.json({ products: mappedProducts, source: "neon_database" });
  } catch (err) {
    console.error("[Products API] Error fetching from DB:", err);
    return NextResponse.json({ products: PRODUCTS, source: "in_memory_fallback", error: (err as Error).message });
  }
}
