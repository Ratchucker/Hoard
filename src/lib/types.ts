// Core domain model. Shaped to map 1:1 onto the eventual Supabase/Postgres schema
// (see /docs or lib/data/schema.sql) so the mock data layer can be swapped for
// real Supabase queries later without changing consumers.

export type ID = string;

export type Category =
  | "trading_card"
  | "sports_card"
  | "comic"
  | "lego"
  | "funko"
  | "coin"
  | "video_game"
  | "other";

export const CATEGORY_LABELS: Record<Category, string> = {
  trading_card: "Trading Card",
  sports_card: "Sports Card",
  comic: "Comic",
  lego: "LEGO",
  funko: "Funko",
  coin: "Coin",
  video_game: "Video Game",
  other: "Other",
};

export type Condition =
  | "mint"
  | "near_mint"
  | "lightly_played"
  | "moderately_played"
  | "heavily_played"
  | "damaged"
  | "sealed"
  | "used"
  | "not_applicable";

export const CONDITION_LABELS: Record<Condition, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  lightly_played: "Lightly Played",
  moderately_played: "Moderately Played",
  heavily_played: "Heavily Played",
  damaged: "Damaged",
  sealed: "Sealed",
  used: "Used",
  not_applicable: "N/A",
};

export type PurchaseSource =
  | "ebay"
  | "facebook"
  | "trademe"
  | "tcgplayer"
  | "cardmarket"
  | "whatnot"
  | "card_show"
  | "local_shop"
  | "private_sale"
  | "other";

export const PURCHASE_SOURCE_LABELS: Record<PurchaseSource, string> = {
  ebay: "eBay",
  facebook: "Facebook",
  trademe: "Trade Me",
  tcgplayer: "TCGplayer",
  cardmarket: "Cardmarket",
  whatnot: "Whatnot",
  card_show: "Card Show",
  local_shop: "Local Shop",
  private_sale: "Private Sale",
  other: "Other",
};

export type ExpenseType =
  | "shipping"
  | "grading"
  | "grading_shipping"
  | "insurance"
  | "authentication"
  | "marketplace_fee"
  | "supplies"
  | "customs"
  | "other";

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  shipping: "Shipping",
  grading: "Grading",
  grading_shipping: "Grading Shipping",
  insurance: "Insurance",
  authentication: "Authentication",
  marketplace_fee: "Marketplace Fees",
  supplies: "Supplies",
  customs: "Customs / Import",
  other: "Other",
};

export interface Money {
  currency: string; // ISO code, e.g. "USD"
  amount: number; // in original currency
  exchangeRate: number; // to base currency, 1 if same
  baseAmount: number; // amount * exchangeRate, in user's base currency
}

export function money(amount: number, currency = "USD", exchangeRate = 1): Money {
  return { currency, amount, exchangeRate, baseAmount: round2(amount * exchangeRate) };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface Expense {
  id: ID;
  collectibleId?: ID; // attached to item, or undefined = general business expense
  lotId?: ID;
  type: ExpenseType;
  description?: string;
  amount: Money;
  date: string; // ISO date
  affectsCostBasis: boolean; // general expenses default to false
}

export type GradingStatus =
  | "preparing"
  | "sent"
  | "received_by_grader"
  | "grading"
  | "shipped_back"
  | "returned";

export const GRADING_STATUS_LABELS: Record<GradingStatus, string> = {
  preparing: "Preparing",
  sent: "Sent",
  received_by_grader: "Received by Grader",
  grading: "Grading",
  shipped_back: "Shipped Back",
  returned: "Returned",
};

export interface GradingSubmission {
  id: ID;
  collectibleId: ID;
  company: string; // PSA, BGS, CGC, SGC, ...
  submissionDate: string;
  gradingFee: number;
  shippingCost: number;
  insurance: number;
  otherCosts: number;
  referenceNumber?: string;
  notes?: string;
  status: GradingStatus;
  valueBeforeGrading?: number;
  grade?: string; // "10", "9.5", ...
  returnDate?: string;
  valueAfterGrading?: number;
}

export interface Lot {
  id: ID;
  name: string;
  purchaseDate: string;
  totalCost: Money;
  source: PurchaseSource;
  seller?: string;
  notes?: string;
  allocationMethod: "equal" | "manual" | "proportional";
}

export interface Attachment {
  id: ID;
  collectibleId?: ID;
  saleId?: ID;
  gradingSubmissionId?: ID;
  tradeId?: ID;
  url: string; // data URL or object URL in mock layer
  filename: string;
  kind: "image" | "receipt" | "screenshot" | "other";
  createdAt: string;
}

export interface TimelineEvent {
  id: ID;
  collectibleId: ID;
  type:
    | "purchased"
    | "expense_added"
    | "sent_for_grading"
    | "returned_from_grading"
    | "grade_received"
    | "value_updated"
    | "sold"
    | "traded"
    | "note";
  date: string;
  description: string;
}

export interface Collectible {
  id: ID;
  name: string;
  category: Category;
  game?: string; // e.g. Pokemon, MTG, Yu-Gi-Oh
  set?: string;
  itemNumber?: string;
  variant?: string;
  quantity: number; // currently owned quantity (after partial sales)
  originalQuantity: number;
  condition: Condition;
  isGraded: boolean;
  gradingCompany?: string;
  grade?: string;
  imageUrl?: string;

  purchaseDate: string;
  purchasePrice: Money; // per full original quantity (total), before other costs
  purchaseSource: PurchaseSource;
  seller?: string;
  purchaseNotes?: string;

  lotId?: ID; // if part of a lot purchase
  allocatedLotCost?: number; // cost basis allocated from lot, in base currency

  estimatedValue: number; // per unit, in base currency
  estimatedValueUpdatedAt: string;
  estimatedValueIsManual: boolean;

  tags: ID[]; // tag ids
  notes?: string;

  status: "owned" | "sold" | "partially_sold" | "traded_away";
  createdAt: string;
  updatedAt: string;
}

export interface SaleTransaction {
  id: ID;
  collectibleId: ID;
  saleDate: string;
  salePrice: Money; // gross, total for quantitySold
  quantitySold: number;
  marketplaceId: ID;
  buyerShippingCharged: number;
  sellerShippingCost: number;
  marketplaceFee: number; // resolved dollar amount at time of sale
  paymentProcessingFee: number;
  otherFees: number;
  feesOverridden: boolean;
  notes?: string;
  costBasisOfSoldUnits: number; // snapshot at time of sale, base currency
  createdAt: string;
}

export interface Marketplace {
  id: ID;
  name: string;
  percentageFee: number; // 0-100
  fixedFee: number;
  feesEnabled: boolean;
  isDefault: boolean;
}

export interface TradeItem {
  id: ID;
  tradeId: ID;
  collectibleId: ID;
  direction: "given" | "received";
  estimatedValue: number;
  costBasisAtTrade?: number; // only relevant for "given" side
}

export interface Trade {
  id: ID;
  date: string;
  counterparty?: string;
  cashAdded: number; // cash user paid on top
  cashReceived: number; // cash user received on top
  fees: number;
  shipping: number;
  notes?: string;
  createdAt: string;
}

export interface WishlistItem {
  id: ID;
  name: string;
  category: Category;
  game?: string;
  set?: string;
  targetPurchasePrice: number;
  currentEstimatedValue: number;
  desiredRoiPercent: number;
  notes?: string;
  sourceUrl?: string;
  currentAskingPrice?: number;
  createdAt: string;
}

export interface Tag {
  id: ID;
  name: string;
  color: string;
}

export interface ValuationHistoryEntry {
  id: ID;
  collectibleId: ID;
  value: number;
  date: string;
  isManual: boolean;
}

export interface ActivityEvent {
  id: ID;
  date: string;
  type:
    | "purchase"
    | "sale"
    | "expense"
    | "grading_submitted"
    | "grading_returned"
    | "lot_purchase"
    | "trade"
    | "value_update";
  description: string;
  amount?: number;
  collectibleId?: ID;
  lotId?: ID;
  tradeId?: ID;
}

export interface ImportTemplate {
  id: ID;
  name: string;
  mapping: Record<string, string>; // targetField -> source column header
  createdAt: string;
}

export interface Settings {
  baseCurrency: string;
  slowMoverDaysThreshold: number;
  slowMoverRoiThreshold: number;
  theme: "light" | "dark" | "system";
}
