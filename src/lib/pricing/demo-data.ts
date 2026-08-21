// Fallback results shown when no PriceCharting API key is configured, so the
// scan-for-price UI has something real to demonstrate before a paid key exists.
// Images are locally-generated placeholder SVGs (not hotlinked photos) — clearly
// illustrative, never presented as real card scans.

import type { PriceMatch } from "./types";

function placeholderCardImage(label: string, from: string, to: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="300" height="420" rx="18" fill="url(#g)" />
      <rect x="14" y="14" width="272" height="392" rx="10" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" />
      <circle cx="150" cy="180" r="54" fill="rgba(255,255,255,0.14)" />
      <path d="M120 190 L145 155 L165 178 L192 138" stroke="rgba(255,255,255,0.85)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <text x="150" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="white" font-weight="600">${label}</text>
      <text x="150" y="386" text-anchor="middle" font-family="sans-serif" font-size="11" letter-spacing="2" fill="rgba(255,255,255,0.6)">PREVIEW IMAGE</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CATALOG: PriceMatch[] = [
  {
    id: "demo-1",
    name: "Charizard VMAX",
    set: "Champion's Path — Secret Rare",
    imageUrl: placeholderCardImage("Charizard VMAX", "#B91C2C", "#0B132B"),
    looseValue: 214.5,
    gradedValue: 480,
    source: "demo",
  },
  {
    id: "demo-2",
    name: "Pikachu Illustrator",
    set: "Promo",
    imageUrl: placeholderCardImage("Pikachu Promo", "#0B132B", "#384166"),
    looseValue: 89.99,
    gradedValue: 165,
    source: "demo",
  },
  {
    id: "demo-3",
    name: "Blastoise",
    set: "Base Set — Holo",
    imageUrl: placeholderCardImage("Blastoise", "#384166", "#6C7A9C"),
    looseValue: 142.0,
    gradedValue: 310,
    source: "demo",
  },
  {
    id: "demo-4",
    name: "Rookie Season Ace #23",
    set: "Prizm 2023 — Silver",
    imageUrl: placeholderCardImage("Rookie Ace #23", "#B91C2C", "#6C7A9C"),
    looseValue: 58.25,
    gradedValue: 210,
    source: "demo",
  },
];

export function searchDemoCatalog(query: string): PriceMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG;
  const matches = CATALOG.filter((c) => c.name.toLowerCase().includes(q) || c.set?.toLowerCase().includes(q));
  return matches.length > 0 ? matches : CATALOG;
}
