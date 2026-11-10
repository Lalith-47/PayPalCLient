import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CartItem, Product, BillingInterval } from "@/types";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId || !db) {
    return NextResponse.json({ items: [] });
  }

  try {
    const rows = await db
      .select({
        cartId: cartItems.id,
        quantity: cartItems.quantity,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.sessionId, sessionId));

    const items: CartItem[] = rows.map((r) => ({
      product: {
        id: r.product.id,
        name: r.product.name,
        category: r.product.category as "essentials" | "subscription_notes",
        price: parseFloat(r.product.price),
        billingInterval: r.product.billingInterval as BillingInterval,
        description: r.product.description,
        badge: r.product.badge || undefined,
        features: (r.product.features as string[]) || [],
        rating: r.product.rating ? parseFloat(r.product.rating) : 4.8,
        reviewsCount: r.product.reviewsCount || 0,
        image: r.product.image,
        inStock: r.product.inStock,
        sampleNote: r.product.sampleNote || undefined,
      },
      quantity: r.quantity,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Cart GET] Error:", err);
    return NextResponse.json({ items: [], error: (err as Error).message });
  }
}

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: true, persisted: false });
  }

  try {
    const body = (await req.json()) as {
      sessionId: string;
      productId: string;
      quantity?: number;
      delta?: number;
    };

    const { sessionId, productId, quantity, delta } = body;
    if (!sessionId || !productId) {
      return NextResponse.json({ error: "Missing sessionId or productId" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      const currentQty = existing[0].quantity;
      const newQty = quantity !== undefined ? quantity : currentQty + (delta ?? 1);

      if (newQty <= 0) {
        await db.delete(cartItems).where(eq(cartItems.id, existing[0].id));
      } else {
        await db
          .update(cartItems)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(cartItems.id, existing[0].id));
      }
    } else {
      const initialQty = quantity ?? delta ?? 1;
      if (initialQty > 0) {
        await db.insert(cartItems).values({
          id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          sessionId,
          productId,
          quantity: initialQty,
        });
      }
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch (err) {
    console.error("[Cart POST] Error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: true, persisted: false });
  }

  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const productId = req.nextUrl.searchParams.get("productId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (productId) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)));
    } else {
      // Clear entire cart
      await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Cart DELETE] Error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
