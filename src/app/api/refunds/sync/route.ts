import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { fetchEventTriageDetails } from "@/lib/paypal-bridge";
import { OwnedItem, BillingInterval } from "@/types";

export async function POST(req: NextRequest) {
  try {
    let sessionId: string | null = null;
    let itemId: string | null = null;

    try {
      const body = await req.json();
      sessionId = body?.sessionId || null;
      itemId = body?.itemId || null;
    } catch {
      // Body may be empty
    }

    if (!db) {
      return NextResponse.json({ success: true, synced: false, newlyApproved: [], orders: [] });
    }

    // 1. Find all orders currently in AWAITING_APPROVAL status
    const pendingOrdersQuery = db
      .select()
      .from(orders)
      .where(
        sessionId
          ? and(eq(orders.status, "AWAITING_APPROVAL"), eq(orders.sessionId, sessionId))
          : eq(orders.status, "AWAITING_APPROVAL")
      );

    const pendingOrders = await pendingOrdersQuery;
    const newlyApproved: Array<{ itemId: string; orderId: string; amountPaid: number; message: string }> = [];
    const newlyRejected: Array<{ itemId: string; orderId: string; message: string }> = [];

    // 2. For each pending order, check live event status on payment.lalithdev.tech
    for (const ord of pendingOrders) {
      if (!ord.refundEventId) continue;

      try {
        const triageData = await fetchEventTriageDetails(ord.refundEventId);
        const eventStatus = triageData?.event?.status;
        const actions = Array.isArray(triageData?.actions) ? triageData.actions : [];
        const isExecuted =
          eventStatus === "EXECUTED" ||
          actions.some((a: any) => a.actionType === "ISSUE_REFUND" && a.status === "SUCCESS");
        const isRejected = eventStatus === "REJECTED";

        if (isExecuted) {
          const refundMsg = `Refund Approved: $${parseFloat(ord.amountPaid).toFixed(2)} was approved by store management on payment.lalithdev.tech and refunded to your PayPal account.`;

          await db
            .update(orders)
            .set({
              status: "REFUNDED",
              refundMessage: refundMsg,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, ord.id));

          newlyApproved.push({
            itemId: ord.id,
            orderId: ord.orderId,
            amountPaid: parseFloat(ord.amountPaid),
            message: refundMsg,
          });
        } else if (isRejected) {
          const rejectMsg = "Return Request Declined: Store management declined this refund request on payment.lalithdev.tech.";

          await db
            .update(orders)
            .set({
              status: "ACTIVE",
              refundMessage: rejectMsg,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, ord.id));

          newlyRejected.push({
            itemId: ord.id,
            orderId: ord.orderId,
            message: rejectMsg,
          });
        }
      } catch (err) {
        console.warn(`[Refund Sync] Failed to check event ${ord.refundEventId}:`, err);
      }
    }

    // 3. Return full updated orders list if sessionId is provided
    let allOrders: OwnedItem[] = [];
    if (sessionId) {
      const rows = await db
        .select({
          order: orders,
          product: products,
        })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .where(eq(orders.sessionId, sessionId))
        .orderBy(desc(orders.purchaseDate));

      allOrders = rows.map((r) => ({
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
    }

    return NextResponse.json({
      success: true,
      synced: true,
      newlyApproved,
      newlyRejected,
      orders: allOrders,
    });
  } catch (err) {
    console.error("[Refund Sync Route Error]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  // Delegate GET to POST logic
  const dummyReq = new NextRequest(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  return POST(dummyReq);
}

