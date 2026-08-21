import { NextResponse } from "next/server";
import { isPriceChartingConfigured, searchPriceCharting } from "@/lib/pricing/pricecharting";
import { searchDemoCatalog } from "@/lib/pricing/demo-data";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  if (!isPriceChartingConfigured()) {
    return NextResponse.json({ results: searchDemoCatalog(query), demo: true });
  }

  try {
    const results = await searchPriceCharting(query);
    return NextResponse.json({ results, demo: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Price lookup failed" },
      { status: 502 }
    );
  }
}
