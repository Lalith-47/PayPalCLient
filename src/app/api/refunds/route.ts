import { NextRequest, NextResponse } from "next/server";
import { requestRefund } from "@/lib/paypal-bridge";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orderId: string;
      itemId?: string;
      captureId?: string;
      amount: number;
      currency?: string;
      reason: string;
      customerEmail?: string;
      customerName?: string;
    };

    if (!body.orderId || !body.amount) {
      return NextResponse.json({ error: "Missing required orderId or amount" }, { status: 400 });
    }

    const result = await requestRefund(body);

    // Update status in local DB if configured
    if (db) {
      try {
        const newStatus = result.status; // 'REFUNDED' or 'AWAITING_APPROVAL'
        if (body.itemId) {
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
