// Provider-agnostic shape for a price-lookup result. Any pricing source (PriceCharting
// today, TCGplayer/CollX/Collectr later) maps its own response onto this before it
// reaches the UI, so components never need to know which provider answered.

export interface PriceMatch {
  id: string;
  name: string;
  set?: string;
  imageUrl?: string;
  /** Ungraded / loose market value, in the user's base currency. */
  looseValue?: number;
  /** Complete-in-box / sealed value, where applicable. */
  completeValue?: number;
  /** New / mint sealed value, where applicable. */
  newValue?: number;
  /** Highest graded-tier value PriceCharting reports (e.g. PSA 10 / BGS 9.5), where applicable. */
  gradedValue?: number;
  source: "pricecharting" | "demo";
}
