import { NextRequest, NextResponse } from "next/server";
import { requestRefund } from "@/lib/paypal-bridge";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orderId: string;
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
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Refund request route error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Refund processing failed" },
      { status: 500 }
    );
  }
}

