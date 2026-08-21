// Server-only client for the PriceCharting API (https://www.pricecharting.com/api-documentation).
// Import this ONLY from Next.js route handlers — never from a client component — so the
// API token stays server-side and is never sent to the browser.
//
// Auth: every request takes a 40-character token as the `t` query param.
// Endpoints used: `/api/products` (search by name) and `/api/product` (fetch by id).
//
// Field names below are confirmed from PriceCharting's published sample response
// (status, id, product-name, console-name, release-date, loose-price, cib-price,
// new-price — integers in pennies) plus their documented image-hosting pattern
// (a direct `image` URL on their CDN). Graded/box-only/manual-only price fields exist
// for some categories but weren't independently confirmed against a live key — treat
// gradedValue as best-effort and re-verify once real API access is wired up.

import type { PriceMatch } from "./types";

const BASE_URL = "https://www.pricecharting.com/api";

interface PriceChartingProduct {
  id: string;
  "product-name": string;
  "console-name"?: string;
  image?: string;
  "loose-price"?: number;
  "cib-price"?: number;
  "new-price"?: number;
  "graded-price"?: number;
}

function centsToDollars(cents: number | undefined): number | undefined {
  return typeof cents === "number" ? Math.round(cents) / 100 : undefined;
}

function toPriceMatch(p: PriceChartingProduct): PriceMatch {
  return {
    id: p.id,
    name: p["product-name"],
    set: p["console-name"],
    imageUrl: p.image,
    looseValue: centsToDollars(p["loose-price"]),
    completeValue: centsToDollars(p["cib-price"]),
    newValue: centsToDollars(p["new-price"]),
    gradedValue: centsToDollars(p["graded-price"]),
    source: "pricecharting",
  };
}

export function isPriceChartingConfigured(): boolean {
  return Boolean(process.env.PRICECHARTING_API_KEY);
}

export async function searchPriceCharting(query: string): Promise<PriceMatch[]> {
  const apiKey = process.env.PRICECHARTING_API_KEY;
  if (!apiKey) throw new Error("PRICECHARTING_API_KEY is not configured");

  const url = new URL(`${BASE_URL}/products`);
  url.searchParams.set("t", apiKey);
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`PriceCharting search failed (${res.status})`);
  }
  const data = await res.json();
  const products: PriceChartingProduct[] = Array.isArray(data.products) ? data.products : [];
  return products.slice(0, 8).map(toPriceMatch);
}
