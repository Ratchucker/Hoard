// Realistic demo data so every screen (dashboals, analytics, slow movers, lots, trades,
// grading, wishlist) is populated on first load. Fictional/generic card names only.

import { money } from "@/lib/types";
import type {
  ActivityEvent,
  Attachment,
  Collectible,
  Expense,
  GradingSubmission,
  Lot,
  Marketplace,
  SaleTransaction,
  Settings,
  Tag,
  TimelineEvent,
  Trade,
  TradeItem,
  ValuationHistoryEntry,
  WishlistItem,
} from "@/lib/types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

let counter = 0;
function id(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}

export function buildSeedData() {
  counter = 0;

  const marketplaces: Marketplace[] = [
    { id: id("mkt"), name: "eBay", percentageFee: 13, fixedFee: 0.3, feesEnabled: true, isDefault: true },
    { id: id("mkt"), name: "Trade Me", percentageFee: 7.9, fixedFee: 0, feesEnabled: true, isDefault: false },
    { id: id("mkt"), name: "Facebook", percentageFee: 5, fixedFee: 0, feesEnabled: true, isDefault: false },
    { id: id("mkt"), name: "Whatnot", percentageFee: 8, fixedFee: 0, feesEnabled: true, isDefault: false },
    { id: id("mkt"), name: "TCGplayer", percentageFee: 10.25, fixedFee: 0, feesEnabled: true, isDefault: false },
    { id: id("mkt"), name: "Cardmarket", percentageFee: 5, fixedFee: 0.25, feesEnabled: true, isDefault: false },
    { id: id("mkt"), name: "Private Sale", percentageFee: 0, fixedFee: 0, feesEnabled: false, isDefault: false },
    { id: id("mkt"), name: "Card Show", percentageFee: 0, fixedFee: 0, feesEnabled: false, isDefault: false },
    { id: id("mkt"), name: "Other", percentageFee: 0, fixedFee: 0, feesEnabled: false, isDefault: false },
  ];
  const [ebay, , , whatnot, tcgplayer, cardmarket] = marketplaces;

  const tags: Tag[] = [
    { id: id("tag"), name: "PC", color: "#6366f1" },
    { id: id("tag"), name: "Flip", color: "#f59e0b" },
    { id: id("tag"), name: "Investment", color: "#10b981" },
    { id: id("tag"), name: "Childhood", color: "#ec4899" },
    { id: id("tag"), name: "Never sell", color: "#ef4444" },
    { id: id("tag"), name: "High risk", color: "#eab308" },
    { id: id("tag"), name: "Grade candidate", color: "#3b82f6" },
  ];
  const [pc, flip, investment, childhood, neverSell, highRisk, gradeCandidate] = tags;

  const collectibles: Collectible[] = [];
  const expenses: Expense[] = [];
  const sales: SaleTransaction[] = [];
  const gradingSubmissions: GradingSubmission[] = [];
  const lots: Lot[] = [];
  const trades: Trade[] = [];
  const tradeItems: TradeItem[] = [];
  const timelineEvents: TimelineEvent[] = [];
  const activityEvents: ActivityEvent[] = [];
  const valuationHistory: ValuationHistoryEntry[] = [];
  const attachments: Attachment[] = [];

  function pushTimeline(collectibleId: string, type: TimelineEvent["type"], date: string, description: string) {
    timelineEvents.push({ id: id("tl"), collectibleId, type, date, description });
  }
  function pushActivity(e: Omit<ActivityEvent, "id">) {
    activityEvents.push({ ...e, id: id("act") });
  }

  function makeItem(
    partial: Omit<Collectible, "id" | "createdAt" | "updatedAt" | "estimatedValueUpdatedAt"> & { valuedDaysAgo?: number },
    acquisition?: { timelineDescription: string; activityDescription: string }
  ): Collectible {
    const cid = id("col");
    const createdAt = partial.purchaseDate;
    const item: Collectible = {
      ...partial,
      id: cid,
      createdAt,
      updatedAt: daysAgo(partial.valuedDaysAgo ?? 3),
      estimatedValueUpdatedAt: daysAgo(partial.valuedDaysAgo ?? 3),
    };
    collectibles.push(item);
    pushTimeline(
      cid,
      "purchased",
      partial.purchaseDate,
      acquisition?.timelineDescription ?? `Purchased for $${partial.purchasePrice.baseAmount}`
    );
    pushActivity({
      date: partial.purchaseDate,
      type: "purchase",
      description: acquisition?.activityDescription ?? `Purchased ${partial.name}`,
      amount: partial.purchasePrice.baseAmount,
      collectibleId: cid,
    });
    valuationHistory.push({ id: id("val"), collectibleId: cid, value: partial.estimatedValue, date: daysAgo(partial.valuedDaysAgo ?? 3), isManual: true });
    return item;
  }

  function addExpenseFor(collectibleId: string, type: Expense["type"], amount: number, date: string, description?: string) {
    expenses.push({ id: id("exp"), collectibleId, type, description, amount: money(amount), date, affectsCostBasis: true });
    pushTimeline(collectibleId, "expense_added", date, `${description ?? type}: $${amount}`);
    pushActivity({ date, type: "expense", description: `${description ?? type} expense added`, amount, collectibleId });
  }

  function sell(item: Collectible, opts: { saleDate: string; salePrice: number; quantitySold: number; marketplace: Marketplace; sellerShipping?: number; buyerShippingCharged?: number; paymentFee?: number; costBasisOverride?: number }) {
    const costBasisPerUnit = round2((itemCostBasisSimple(item, expenses)) / item.originalQuantity);
    const costBasis = opts.costBasisOverride ?? round2(costBasisPerUnit * opts.quantitySold);
    const marketplaceFee = round2(opts.salePrice * (opts.marketplace.percentageFee / 100) + opts.marketplace.fixedFee);
    const s: SaleTransaction = {
      id: id("sale"),
      collectibleId: item.id,
      saleDate: opts.saleDate,
      salePrice: money(opts.salePrice),
      quantitySold: opts.quantitySold,
      marketplaceId: opts.marketplace.id,
      buyerShippingCharged: opts.buyerShippingCharged ?? 0,
      sellerShippingCost: opts.sellerShipping ?? 0,
      marketplaceFee,
      paymentProcessingFee: opts.paymentFee ?? 0,
      otherFees: 0,
      feesOverridden: false,
      costBasisOfSoldUnits: costBasis,
      createdAt: opts.saleDate,
    };
    sales.push(s);
    const remaining = item.quantity - opts.quantitySold;
    item.quantity = Math.max(0, remaining);
    item.status = remaining <= 0 ? "sold" : "partially_sold";
    pushTimeline(item.id, "sold", opts.saleDate, `Sold ${opts.quantitySold} for $${opts.salePrice}`);
    pushActivity({ date: opts.saleDate, type: "sale", description: `Sold ${item.name}`, amount: opts.salePrice, collectibleId: item.id });
    return s;
  }

  function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }
  function itemCostBasisSimple(item: Collectible, exps: Expense[]) {
    const attached = exps.filter((e) => e.collectibleId === item.id && e.affectsCostBasis).reduce((sum, e) => sum + e.amount.baseAmount, 0);
    const lotCost = item.allocatedLotCost ?? 0;
    const purchase = item.lotId ? 0 : item.purchasePrice.baseAmount;
    return round2(purchase + lotCost + attached);
  }

  // ---- 1. Profitable raw card, owned ----
  const bladeDragon = makeItem({
    name: "Blade Dragon EX",
    category: "trading_card",
    game: "Pokemon",
    set: "Obsidian Flames",
    itemNumber: "125/197",
    variant: "Holo",
    quantity: 1,
    originalQuantity: 1,
    condition: "near_mint",
    isGraded: false,
    imageUrl: "",
    purchaseDate: daysAgo(210),
    purchasePrice: money(50),
    purchaseSource: "ebay",
    seller: "cardvault88",
    estimatedValue: 92,
    estimatedValueIsManual: true,
    tags: [investment.id],
    status: "owned",
    valuedDaysAgo: 4,
  });
  addExpenseFor(bladeDragon.id, "shipping", 4.5, daysAgo(210), "Shipping");

  // ---- 2. Losing raw card, owned ----
  makeItem({
    name: "Frost Wyrm Sentinel",
    category: "trading_card",
    game: "Pokemon",
    set: "Silver Tempest",
    itemNumber: "45/195",
    variant: "Reverse Holo",
    quantity: 2,
    originalQuantity: 2,
    condition: "lightly_played",
    isGraded: false,
    purchaseDate: daysAgo(320),
    purchasePrice: money(60),
    purchaseSource: "facebook",
    seller: "Marketplace",
    estimatedValue: 18,
    estimatedValueIsManual: true,
    tags: [highRisk.id],
    status: "owned",
    valuedDaysAgo: 10,
  });

  // ---- 3. Graded profitable (PSA 10) ----
  const galaxyTitan = makeItem({
    name: "Galaxy Titan Charizard",
    category: "trading_card",
    game: "Pokemon",
    set: "Base Set 2",
    itemNumber: "4/130",
    variant: "1st Edition",
    quantity: 1,
    originalQuantity: 1,
    condition: "not_applicable",
    isGraded: true,
    gradingCompany: "PSA",
    grade: "10",
    purchaseDate: daysAgo(400),
    purchasePrice: money(75),
    purchaseSource: "card_show",
    estimatedValue: 240,
    estimatedValueIsManual: true,
    tags: [pc.id, neverSell.id],
    status: "owned",
    valuedDaysAgo: 2,
  });
  addExpenseFor(galaxyTitan.id, "grading", 45, daysAgo(370), "PSA grading fee");
  addExpenseFor(galaxyTitan.id, "grading_shipping", 12, daysAgo(370), "Grading shipping");
  addExpenseFor(galaxyTitan.id, "supplies", 3, daysAgo(370), "Supplies");
  pushTimeline(galaxyTitan.id, "grade_received", daysAgo(340), "Returned graded PSA 10");
  pushActivity({ date: daysAgo(340), type: "grading_returned", description: "Received PSA 10 grade", collectibleId: galaxyTitan.id });
  gradingSubmissions.push({
    id: id("grd"), collectibleId: galaxyTitan.id, company: "PSA", submissionDate: daysAgo(370),
    gradingFee: 45, shippingCost: 12, insurance: 0, otherCosts: 3, referenceNumber: "PSA-88213",
    status: "returned", valueBeforeGrading: 75, grade: "10", returnDate: daysAgo(340), valueAfterGrading: 240,
  });

  // ---- 4. Sold profitable (matches spec worked example) ----
  const shadowPhoenix = makeItem({
    name: "Shadow Phoenix Ace",
    category: "trading_card",
    game: "Pokemon",
    set: "Crown Zenith",
    itemNumber: "GG34/GG70",
    variant: "Gold Rare",
    quantity: 0,
    originalQuantity: 1,
    condition: "not_applicable",
    isGraded: true,
    gradingCompany: "PSA",
    grade: "10",
    purchaseDate: daysAgo(180),
    purchasePrice: money(50),
    purchaseSource: "ebay",
    estimatedValue: 190,
    estimatedValueIsManual: true,
    tags: [flip.id],
    status: "owned",
    valuedDaysAgo: 60,
  });
  addExpenseFor(shadowPhoenix.id, "shipping", 6, daysAgo(180), "Shipping");
  addExpenseFor(shadowPhoenix.id, "grading", 45, daysAgo(175), "Grading");
  addExpenseFor(shadowPhoenix.id, "grading_shipping", 12, daysAgo(175), "Grading shipping");
  addExpenseFor(shadowPhoenix.id, "supplies", 3, daysAgo(175), "Supplies");
  sell(shadowPhoenix, { saleDate: daysAgo(30), salePrice: 220, quantitySold: 1, marketplace: ebay, sellerShipping: 8, paymentFee: 7 });

  // ---- 5. Sold at a loss ----
  const emberFox = makeItem({
    name: "Ember Fox Scout",
    category: "trading_card",
    game: "Pokemon",
    set: "Paldea Evolved",
    itemNumber: "38/193",
    variant: "Holo",
    quantity: 0,
    originalQuantity: 1,
    condition: "near_mint",
    isGraded: false,
    purchaseDate: daysAgo(150),
    purchasePrice: money(40),
    purchaseSource: "whatnot",
    estimatedValue: 15,
    estimatedValueIsManual: true,
    tags: [highRisk.id],
    status: "owned",
    valuedDaysAgo: 40,
  });
  sell(emberFox, { saleDate: daysAgo(20), salePrice: 16, quantitySold: 1, marketplace: whatnot, sellerShipping: 4 });

  // ---- 6. Sports card, owned, profitable ----
  const rookieAce = makeItem({
    name: "Rookie Season Ace #23",
    category: "sports_card",
    game: "Basketball",
    set: "Prizm 2023",
    itemNumber: "223",
    variant: "Silver Prizm",
    quantity: 1,
    originalQuantity: 1,
    condition: "mint",
    isGraded: true,
    gradingCompany: "BGS",
    grade: "9.5",
    purchaseDate: daysAgo(260),
    purchasePrice: money(120),
    purchaseSource: "tcgplayer",
    estimatedValue: 210,
    estimatedValueIsManual: true,
    tags: [investment.id],
    status: "owned",
    valuedDaysAgo: 5,
  });
  addExpenseFor(rookieAce.id, "grading", 60, daysAgo(250), "BGS grading");

  // ---- 7. Comic, owned, slow mover ----
  makeItem({
    name: "Cosmic Sentinel #1",
    category: "comic",
    set: "First Print",
    itemNumber: "#1",
    variant: "Newsstand",
    quantity: 1,
    originalQuantity: 1,
    condition: "near_mint",
    isGraded: false,
    purchaseDate: daysAgo(500),
    purchasePrice: money(90),
    purchaseSource: "local_shop",
    estimatedValue: 95,
    estimatedValueIsManual: true,
    tags: [childhood.id],
    status: "owned",
    valuedDaysAgo: 200,
  });

  // ---- 8. LEGO set, sealed, owned, big winner ----
  makeItem({
    name: "Skyline Express Building Set",
    category: "lego",
    set: "Icons",
    itemNumber: "10312",
    variant: "Sealed",
    quantity: 1,
    originalQuantity: 1,
    condition: "sealed",
    isGraded: false,
    purchaseDate: daysAgo(600),
    purchasePrice: money(150),
    purchaseSource: "local_shop",
    estimatedValue: 310,
    estimatedValueIsManual: true,
    tags: [investment.id, neverSell.id],
    status: "owned",
    valuedDaysAgo: 15,
  });

  // ---- 9. Funko, slow mover / dead money ----
  makeItem({
    name: "Galactic Ranger Chase Variant",
    category: "funko",
    set: "Convention Exclusive",
    variant: "Chase",
    quantity: 1,
    originalQuantity: 1,
    condition: "sealed",
    isGraded: false,
    purchaseDate: daysAgo(400),
    purchasePrice: money(65),
    purchaseSource: "ebay",
    estimatedValue: 62,
    estimatedValueIsManual: true,
    tags: [],
    status: "owned",
    valuedDaysAgo: 190,
  });

  // ---- 10. Coin, owned, modest gain ----
  makeItem({
    name: "1921 Commemorative Silver Dollar",
    category: "coin",
    condition: "near_mint",
    isGraded: true,
    gradingCompany: "PCGS",
    grade: "MS64",
    quantity: 1,
    originalQuantity: 1,
    purchaseDate: daysAgo(700),
    purchasePrice: money(85),
    purchaseSource: "private_sale",
    estimatedValue: 120,
    estimatedValueIsManual: true,
    tags: [pc.id],
    status: "owned",
    valuedDaysAgo: 30,
  });

  // ---- 11. Sealed video game, slow mover ----
  makeItem({
    name: "Retro Quest Legends (Sealed)",
    category: "video_game",
    variant: "Black Label",
    quantity: 1,
    originalQuantity: 1,
    condition: "sealed",
    isGraded: false,
    purchaseDate: daysAgo(450),
    purchasePrice: money(140),
    purchaseSource: "card_show",
    estimatedValue: 145,
    estimatedValueIsManual: true,
    tags: [childhood.id, highRisk.id],
    status: "owned",
    valuedDaysAgo: 220,
  });

  // ---- 12. Card currently being graded ----
  const auroraSerpent = makeItem({
    name: "Aurora Serpent Lord",
    category: "trading_card",
    game: "Pokemon",
    set: "Astral Radiance",
    itemNumber: "182/189",
    variant: "Alt Art",
    quantity: 1,
    originalQuantity: 1,
    condition: "near_mint",
    isGraded: false,
    purchaseDate: daysAgo(60),
    purchasePrice: money(110),
    purchaseSource: "tcgplayer",
    estimatedValue: 175,
    estimatedValueIsManual: true,
    tags: [gradeCandidate.id, flip.id],
    status: "owned",
    valuedDaysAgo: 20,
  });
  addExpenseFor(auroraSerpent.id, "grading", 30, daysAgo(25), "PSA grading fee");
  addExpenseFor(auroraSerpent.id, "grading_shipping", 15, daysAgo(25), "Grading shipping");
  pushTimeline(auroraSerpent.id, "sent_for_grading", daysAgo(25), "Sent to PSA for grading");
  pushActivity({ date: daysAgo(25), type: "grading_submitted", description: "Sent to PSA for grading", amount: 45, collectibleId: auroraSerpent.id });
  gradingSubmissions.push({
    id: id("grd"), collectibleId: auroraSerpent.id, company: "PSA", submissionDate: daysAgo(25),
    gradingFee: 30, shippingCost: 15, insurance: 0, otherCosts: 0, referenceNumber: "PSA-90410",
    status: "grading", valueBeforeGrading: 175,
  });

  // ---- 13. Partially sold booster boxes (quantity example from spec) ----
  const boosterBox = makeItem({
    name: "Vaultbreak Booster Box",
    category: "trading_card",
    game: "Pokemon",
    set: "Vaultbreak",
    variant: "Sealed",
    quantity: 10,
    originalQuantity: 10,
    condition: "sealed",
    isGraded: false,
    purchaseDate: daysAgo(90),
    purchasePrice: money(1800),
    purchaseSource: "tcgplayer",
    estimatedValue: 210,
    estimatedValueIsManual: true,
    tags: [flip.id],
    status: "owned",
    valuedDaysAgo: 6,
  });
  sell(boosterBox, { saleDate: daysAgo(15), salePrice: 750, quantitySold: 3, marketplace: tcgplayer, sellerShipping: 25 });

  // ---- 14 & 15. Lot purchase: Pokemon binder split into two tracked items + rest untracked ----
  const binderLot: Lot = {
    id: id("lot"),
    name: "Pokemon Binder Collection Lot",
    purchaseDate: daysAgo(120),
    totalCost: money(500),
    source: "facebook",
    seller: "local collector",
    notes: "63 cards total; only the standout cards were catalogued individually.",
    allocationMethod: "proportional",
  };
  lots.push(binderLot);
  pushActivity({ date: binderLot.purchaseDate, type: "lot_purchase", description: "Bought lot: Pokemon Binder Collection Lot", amount: 500, lotId: binderLot.id });

  makeItem({
    name: "Binder Charizard VMAX",
    category: "trading_card",
    game: "Pokemon",
    set: "Champion's Path",
    itemNumber: "74/73",
    variant: "Secret Rare",
    quantity: 1,
    originalQuantity: 1,
    condition: "near_mint",
    isGraded: false,
    purchaseDate: daysAgo(120),
    purchasePrice: money(0),
    purchaseSource: "facebook",
    lotId: binderLot.id,
    allocatedLotCost: 150,
    estimatedValue: 220,
    estimatedValueIsManual: true,
    tags: [investment.id],
    status: "owned",
    valuedDaysAgo: 8,
  });
  const lotOther = makeItem({
    name: "Binder Assorted Holo Rares",
    category: "trading_card",
    game: "Pokemon",
    set: "Mixed",
    quantity: 20,
    originalQuantity: 20,
    condition: "lightly_played",
    isGraded: false,
    purchaseDate: daysAgo(120),
    purchasePrice: money(0),
    purchaseSource: "facebook",
    lotId: binderLot.id,
    allocatedLotCost: 200,
    estimatedValue: 12,
    estimatedValueIsManual: true,
    tags: [],
    status: "owned",
    valuedDaysAgo: 8,
  });
  sell(lotOther, { saleDate: daysAgo(50), salePrice: 96, quantitySold: 8, marketplace: cardmarket, sellerShipping: 6 });

  // ---- 16 & 17. Trade: gave a card, received a card + cash added ----
  const givenCard = makeItem({
    name: "Pikachu Promo Stamp",
    category: "trading_card",
    game: "Pokemon",
    set: "Celebrations",
    itemNumber: "5/25",
    quantity: 0,
    originalQuantity: 1,
    condition: "near_mint",
    isGraded: false,
    purchaseDate: daysAgo(250),
    purchasePrice: money(80),
    purchaseSource: "ebay",
    estimatedValue: 150,
    estimatedValueIsManual: true,
    tags: [],
    status: "owned",
    valuedDaysAgo: 45,
  });
  givenCard.status = "traded_away";
  const trade: Trade = {
    id: id("trd"),
    date: daysAgo(45),
    counterparty: "tradernick_",
    cashAdded: 20,
    cashReceived: 0,
    fees: 0,
    shipping: 10,
    notes: "Local meet-up trade, both cards verified authentic.",
    createdAt: daysAgo(45),
  };
  trades.push(trade);
  const receivedCard = makeItem(
    {
      name: "Charizard Holo (Trade-In)",
      category: "trading_card",
      game: "Pokemon",
      set: "Base Set",
      itemNumber: "4/102",
      quantity: 1,
      originalQuantity: 1,
      condition: "lightly_played",
      isGraded: false,
      purchaseDate: daysAgo(45),
      purchasePrice: money(0),
      purchaseSource: "private_sale",
      purchaseNotes: "Received via trade",
      estimatedValue: 180,
      estimatedValueIsManual: true,
      tags: [pc.id],
      status: "owned",
      valuedDaysAgo: 12,
    },
    {
      timelineDescription:
        "Received via trade with tradernick_ — cost basis: $80.00 cost basis of Pikachu Promo Stamp + $20.00 cash added + $10.00 shipping",
      activityDescription: "Received Charizard Holo (Trade-In) via trade",
    }
  );
  // Transferred cost basis = given item's cost basis ($80) + cash added ($20) + shipping ($10).
  receivedCard.allocatedLotCost = 110;
  tradeItems.push(
    { id: id("ti"), tradeId: trade.id, collectibleId: givenCard.id, direction: "given", estimatedValue: 150, costBasisAtTrade: 80 },
    { id: id("ti"), tradeId: trade.id, collectibleId: receivedCard.id, direction: "received", estimatedValue: 180 }
  );
  pushTimeline(givenCard.id, "traded", trade.date, "Traded away (est. value $150)");
  pushActivity({ date: trade.date, type: "trade", description: "Trade recorded with tradernick_", tradeId: trade.id });

  // ---- 18. Another owned graded winner for variety ----
  const mysticOracle = makeItem({
    name: "Mystic Oracle Prime",
    category: "trading_card",
    game: "MTG",
    set: "Modern Horizons 3",
    itemNumber: "212",
    variant: "Foil",
    quantity: 1,
    originalQuantity: 1,
    condition: "not_applicable",
    isGraded: true,
    gradingCompany: "CGC",
    grade: "9.5",
    purchaseDate: daysAgo(140),
    purchasePrice: money(35),
    purchaseSource: "cardmarket",
    estimatedValue: 88,
    estimatedValueIsManual: true,
    tags: [flip.id, gradeCandidate.id],
    status: "owned",
    valuedDaysAgo: 9,
  });
  addExpenseFor(mysticOracle.id, "grading", 25, daysAgo(130), "CGC grading");

  // General business expenses (not attached to items)
  expenses.push(
    { id: id("exp"), type: "supplies", description: "Toploaders + sleeves bulk pack", amount: money(38), date: daysAgo(80), affectsCostBasis: false },
    { id: id("exp"), type: "supplies", description: "Storage boxes", amount: money(52), date: daysAgo(160), affectsCostBasis: false },
    { id: id("exp"), type: "other", description: "Card show entry fee", amount: money(15), date: daysAgo(45), affectsCostBasis: false },
    { id: id("exp"), type: "other", description: "Travel to regional show", amount: money(60), date: daysAgo(45), affectsCostBasis: false }
  );
  for (const e of expenses.slice(-4)) {
    pushActivity({ date: e.date, type: "expense", description: `${e.description} (general)`, amount: e.amount.baseAmount });
  }

  // Wishlist
  const wishlist: WishlistItem[] = [
    {
      id: id("wish"), name: "Eternal Flame Guardian (Alt Art)", category: "trading_card", game: "Pokemon", set: "Paradox Rift",
      targetPurchasePrice: 60, currentEstimatedValue: 95, desiredRoiPercent: 25, currentAskingPrice: 72,
      notes: "Watching two listings, waiting for a price drop.", createdAt: daysAgo(14),
    },
    {
      id: id("wish"), name: "1986 Rookie Legend #1", category: "sports_card", currentEstimatedValue: 300,
      targetPurchasePrice: 220, desiredRoiPercent: 20, currentAskingPrice: 260, createdAt: daysAgo(5),
    },
  ];

  const settings: Settings = {
    baseCurrency: "USD",
    slowMoverDaysThreshold: 180,
    slowMoverRoiThreshold: 5,
    theme: "system",
  };

  return {
    collectibles,
    expenses,
    sales,
    marketplaces,
    gradingSubmissions,
    lots,
    trades,
    tradeItems,
    wishlist,
    tags,
    attachments,
    timelineEvents,
    activityEvents,
    valuationHistory,
    settings,
    importTemplates: [],
  };
}
