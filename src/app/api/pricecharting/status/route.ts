import { NextResponse } from "next/server";
import { isPriceChartingConfigured } from "@/lib/pricing/pricecharting";

export async function GET() {
  return NextResponse.json({ configured: isPriceChartingConfigured() });
}
