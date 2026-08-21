// Normalizes free-text values from imported CSVs (which may come from other collection
// apps with their own vocabulary) onto our internal Category/Condition enums.
// Unrecognized input falls back to a sensible default rather than failing the row.

import { CATEGORY_LABELS, CONDITION_LABELS, type Category, type Condition } from "@/lib/types";

const CATEGORY_ALIASES: Record<string, Category> = {
  pokemon: "trading_card", mtg: "trading_card", "magic the gathering": "trading_card",
  "yu-gi-oh": "trading_card", yugioh: "trading_card", tcg: "trading_card", "trading card": "trading_card",
  sports: "sports_card", "sports card": "sports_card", basketball: "sports_card", football: "sports_card",
  baseball: "sports_card", comic: "comic", comics: "comic", lego: "lego", funko: "funko", "funko pop": "funko",
  coin: "coin", coins: "coin", "video game": "video_game", videogame: "video_game", game: "video_game",
};

export function normalizeCategory(raw?: string): Category {
  if (!raw) return "trading_card";
  const key = raw.trim().toLowerCase();
  if (key in CATEGORY_LABELS) return key as Category;
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];
  const byLabel = Object.entries(CATEGORY_LABELS).find(([, label]) => label.toLowerCase() === key);
  return byLabel ? (byLabel[0] as Category) : "trading_card";
}

const CONDITION_ALIASES: Record<string, Condition> = {
  m: "mint", nm: "near_mint", "nm-mt": "near_mint", lp: "lightly_played", mp: "moderately_played",
  hp: "heavily_played", dmg: "damaged", new: "sealed", "brand new": "sealed", "sealed/new": "sealed",
};

export function normalizeCondition(raw?: string): Condition {
  if (!raw) return "near_mint";
  const key = raw.trim().toLowerCase();
  if (key in CONDITION_LABELS) return key as Condition;
  if (CONDITION_ALIASES[key]) return CONDITION_ALIASES[key];
  const byLabel = Object.entries(CONDITION_LABELS).find(([, label]) => label.toLowerCase() === key);
  return byLabel ? (byLabel[0] as Condition) : "near_mint";
}
