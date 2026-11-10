import { db } from "./index";
import { products } from "./schema";
import { PRODUCTS } from "../data/products";

export async function seedProductsIfEmpty() {
  if (!db) return;

  try {
    const existing = await db.select().from(products).limit(1);
    if (existing.length === 0) {
      console.log("[DB Seed] Seeding products into Neon DB...");
      for (const p of PRODUCTS) {
        await db
          .insert(products)
          .values({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price.toString(),
            billingInterval: p.billingInterval || "one_time",
            description: p.description,
            badge: p.badge || null,
            features: p.features,
            rating: p.rating.toString(),
            reviewsCount: p.reviewsCount,
            image: p.image,
            inStock: p.inStock,
            sampleNote: p.sampleNote || null,
          })
          .onConflictDoNothing();
      }
      console.log(`[DB Seed] Seeded ${PRODUCTS.length} products successfully.`);
    }
  } catch (err) {
    console.warn("[DB Seed] Could not auto-seed products:", err);
  }
}
