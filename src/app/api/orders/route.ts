import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { OwnedItem, BillingInterval } from "@/types";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId || !db) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const rows = await db
      .select({
        order: orders,
        product: products,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.sessionId, sessionId))
      .orderBy(desc(orders.purchaseDate));

    const ownedItems: OwnedItem[] = rows.map((r) => ({
      id: r.order.id,
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
      orderId: r.order.orderId,
      invoiceId: r.order.invoiceId || undefined,
      purchaseDate: r.order.purchaseDate.toISOString().split("T")[0],
      amountPaid: parseFloat(r.order.amountPaid),
      status: r.order.status as "ACTIVE" | "REFUNDED" | "AWAITING_APPROVAL",
      refundEventId: r.order.refundEventId || undefined,
      refundMessage: r.order.refundMessage || undefined,
    }));

    return NextResponse.json({ orders: ownedItems });
  } catch (err) {
    console.error("[Orders GET] Error:", err);
    return NextResponse.json({ orders: [], error: (err as Error).message });
  }
}

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: true, persisted: false });
  }

  try {
    const body = (await req.json()) as {
      sessionId: string;
      orderId: string;
      invoiceId?: string;
      invoiceNumber?: string;
      customerName: string;
      customerEmail: string;
      items: Array<{
        productId: string;
        amountPaid?: number;
        price?: number;
      }>;
    };

    const { sessionId, orderId, invoiceId, invoiceNumber, customerName, customerEmail, items } = body;

    for (const it of items) {
      const finalAmount = it.amountPaid ?? it.price ?? 0;
      await db.insert(orders).values({
        id: `ord_${Date.now()}_${it.productId}`,
        orderId,
        invoiceId: invoiceId || null,
        invoiceNumber: invoiceNumber || null,
        sessionId,
        customerName,
        customerEmail,
        productId: it.productId,
        amountPaid: Number(finalAmount).toFixed(2),
        status: "ACTIVE",
      });
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch (err) {
    console.error("[Orders POST] Error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
