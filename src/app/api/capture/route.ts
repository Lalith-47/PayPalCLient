import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal-bridge";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orderId: string;
      mockCode?: "INSTRUMENT_DECLINED" | "TRANSACTION_REFUSED" | "NONE";
    };

    if (!body.orderId) {
      return NextResponse.json({ error: "Missing required field: orderId" }, { status: 400 });
    }

    const result = await capturePayPalOrder({
      orderId: body.orderId,
      mockCode: body.mockCode,
    });

    if (result.status === "DECLINED") {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Capture API error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Capture processing failed" },
      { status: 500 }
    );
  }
}
