import { NextRequest, NextResponse } from "next/server";
import { createPayPalInvoice, createPayPalOrder } from "@/lib/paypal-bridge";
import { CartItem, CustomerInfo, InvoiceLineItem } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      items?: CartItem[];
      cart?: CartItem[];
      lineItems?: InvoiceLineItem[];
      customer: CustomerInfo;
      amount?: number;
      currency?: string;
      dueDays?: number;
    };

    const cartList = body.items || body.cart || [];
    const currency = body.currency || "USD";
    const dueDays = body.dueDays ?? 15;

    let lineItems: InvoiceLineItem[] = [];
    let total = 0;

    if (cartList.length > 0) {
      total = cartList.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      lineItems = cartList.map((i) => ({
        description: `${i.product.name}${
          i.product.category === "subscription_notes" ? " [Notes Subscription Pass]" : ""
        }`,
        quantity: i.quantity,
        unitPrice: i.product.price,
        isSubscription: i.product.category === "subscription_notes",
      }));
    } else if (body.lineItems && body.lineItems.length > 0) {
      lineItems = body.lineItems;
      total = body.amount ?? lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    } else {
      return NextResponse.json({ error: "Shopping cart is empty" }, { status: 400 });
    }

    // 1. Create official PayPal Invoice via Revenue Guardian (payment.lalithdev.tech)
    const invoice = await createPayPalInvoice({
      customer: body.customer,
      lineItems,
      amount: parseFloat(total.toFixed(2)),
      currency,
      dueDays,
    });

    // 2. Also initialize PayPal Sandbox Order for direct checkout / capture simulation
    const itemSummary = lineItems.map((li) => `${li.description} (x${li.quantity})`).join(", ");
    let orderId: string | undefined;
    let approvalLink: string | null = null;
    try {
      const order = await createPayPalOrder({
        amount: total.toFixed(2),
        currency,
        description: `CampusVault Invoice #${invoice.invoiceNumber}: ${itemSummary.slice(0, 100)}`,
      });
      orderId = order.orderId;
      approvalLink = order.approvalLink;
    } catch (orderErr) {
      console.warn("Could not pre-create PayPal Order alongside invoice:", orderErr);
    }

    invoice.orderId = orderId;
    invoice.approvalLink = approvalLink;

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (err) {
    console.error("Invoice creation route error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate invoice from payment.lalithdev.tech" },
      { status: 500 }
    );
  }
}

