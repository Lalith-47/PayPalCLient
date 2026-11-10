import { NextRequest, NextResponse } from "next/server";
import { fetchEventTriageDetails } from "@/lib/paypal-bridge";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const event = await fetchEventTriageDetails(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found or still enqueuing" }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (err) {
    console.error("Event fetch error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to retrieve event" },
      { status: 500 }
    );
  }
}
