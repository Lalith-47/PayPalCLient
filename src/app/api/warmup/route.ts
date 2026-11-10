import { NextResponse } from "next/server";
import { pingDatabase } from "@/db";

export async function GET() {
  const result = await pingDatabase();
  return NextResponse.json(result, {
    status: result.ok ? 200 : 200, // return 200 so app doesn't error out even during warmup
    headers: { "Cache-Control": "no-store" },
  });
}
