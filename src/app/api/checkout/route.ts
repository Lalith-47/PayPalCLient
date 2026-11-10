import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal-bridge";
import { CartItem, CustomerInfo } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      items: CartItem[];
      customer: CustomerInfo;
      currency?: string;
    };

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Shopping cart is empty" }, { status: 400 });
    }

    // Calculate total amount
    const total = body.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const formattedAmount = total.toFixed(2);
    const itemNames = body.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ");
    const description = `Student Order: ${itemNames.slice(0, 120)}`;

    const order = await createPayPalOrder({
      amount: formattedAmount,
      currency: body.currency || "USD",
      description,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      approvalLink: order.approvalLink,
      total: formattedAmount,
      currency: body.currency || "USD",
    });
  } catch (err) {
    console.error("Checkout creation error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
