import { NextRequest, NextResponse } from "next/server";
import { requestRefund } from "@/lib/paypal-bridge";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RefundItemInput {
  id: string;
  orderId: string;
  captureId?: string;
  amount: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      // Batch mode
      items?: RefundItemInput[];
      // Single mode
      orderId?: string;
      itemId?: string;
      captureId?: string;
      amount?: number;
      // Common
      currency?: string;
      reason: string;
      customerEmail?: string;
      customerName?: string;
    };

    if (!body.reason) {
      return NextResponse.json({ error: "Missing required return reason" }, { status: 400 });
    }

    // 1. BATCH MODE: Group of items selected for refund at once
    if (Array.isArray(body.items) && body.items.length > 0) {
      const results: Array<{
        id: string;
        orderId: string;
        amount: number;
        status: "REFUNDED" | "AWAITING_APPROVAL" | "ERROR";
        decision?: "AUTO" | "NEEDS_APPROVAL";
        eventId?: string;
        message?: string;
        error?: string;
      }> = [];

      for (const item of body.items) {
        try {
          const res = await requestRefund({
            orderId: item.orderId,
            captureId: item.captureId || item.orderId,
            amount: item.amount,
            currency: body.currency || "USD",
            reason: body.reason,
            customerEmail: body.customerEmail,
            customerName: body.customerName,
          });

          // Strictly update the row matching item.id in Neon DB
          if (db) {
            await db
              .update(orders)
              .set({
                status: res.status,
                refundEventId: res.eventId,
                refundReason: body.reason,
                refundMessage: res.message,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, item.id));
          }

          results.push({
            id: item.id,
            orderId: item.orderId,
            amount: item.amount,
            status: res.status,
            decision: res.decision,
            eventId: res.eventId,
            message: res.message,
          });
        } catch (itemErr) {
          console.error(`[Refund Item Error for ${item.id}]:`, itemErr);
          results.push({
            id: item.id,
            orderId: item.orderId,
            amount: item.amount,
            status: "ERROR",
            error: (itemErr as Error).message,
          });
        }
      }

      const totalRefunded = results
        .filter((r) => r.status === "REFUNDED")
        .reduce((sum, r) => sum + r.amount, 0);
      const totalPending = results
        .filter((r) => r.status === "AWAITING_APPROVAL")
        .reduce((sum, r) => sum + r.amount, 0);

      return NextResponse.json({
        success: true,
        batch: true,
        items: results,
        totalRefunded,
        totalPending,
        hasPendingApproval: results.some((r) => r.status === "AWAITING_APPROVAL"),
      });
    }

    // 2. SINGLE MODE: Single item refund (backward compatible)
    if (!body.orderId || !body.amount) {
      return NextResponse.json(
        { error: "Missing required items array or orderId/amount" },
        { status: 400 }
      );
    }

    const result = await requestRefund({
      orderId: body.orderId,
      captureId: body.captureId || body.orderId,
      amount: body.amount,
      currency: body.currency || "USD",
      reason: body.reason,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
    });

    // Update status in local DB if configured
    if (db) {
      try {
        const newStatus = result.status; // 'REFUNDED' or 'AWAITING_APPROVAL'
        if (body.itemId) {
          // Strictly update only the specific item row by id
          await db
            .update(orders)
            .set({
              status: newStatus,
              refundEventId: result.eventId,
              refundReason: body.reason,
              refundMessage: result.message,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, body.itemId));
        } else {
          await db
            .update(orders)
            .set({
              status: newStatus,
              refundEventId: result.eventId,
              refundReason: body.reason,
              refundMessage: result.message,
              updatedAt: new Date(),
            })
            .where(eq(orders.orderId, body.orderId));
        }
      } catch (dbErr) {
        console.warn("[Refund DB Sync] Failed to update orders row:", dbErr);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Refund request route error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Refund processing failed" },
      { status: 500 }
    );
  }
}
