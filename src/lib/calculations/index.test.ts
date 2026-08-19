import { describe, expect, it } from "vitest";
import { money } from "@/lib/types";
import type { Collectible, Expense, Marketplace, SaleTransaction } from "@/lib/types";
import {
  allocateLotCost,
  annualisedRoi,
  breakEvenPrice,
  capitalRecovered,
  costBasisForQuantity,
  costBasisPerUnit,
  estimateFees,
  holdingPeriodDays,
  itemCostBasis,
  netProceeds,
  realisedProfit,
  realisedRoi,
  remainingCostBasis,
  roiPercent,
  safeDiv,
  unrealisedGain,
  unrealisedRoi,
} from "./index";

const baseItem = (overrides: Partial<Collectible> = {}): Collectible => ({
  id: "c1",
  name: "Test Card",
  category: "trading_card",
  quantity: 1,
  originalQuantity: 1,
  condition: "near_mint",
  isGraded: false,
  purchaseDate: "2024-01-01",
  purchasePrice: money(50),
  purchaseSource: "ebay",
  estimatedValue: 190,
  estimatedValueUpdatedAt: "2024-06-01",
  estimatedValueIsManual: true,
  tags: [],
  status: "owned",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  ...overrides,
});

const ebay: Marketplace = {
  id: "m1",
  name: "eBay",
  percentageFee: 13,
  fixedFee: 0.3,
  feesEnabled: true,
  isDefault: true,
};

describe("safeDiv", () => {
  it("returns 0 instead of NaN when dividing by zero", () => {
    expect(safeDiv(10, 0)).toBe(0);
  });
  it("divides normally otherwise", () => {
    expect(safeDiv(10, 2)).toBe(5);
  });
});

describe("roiPercent", () => {
  it("handles zero cost basis without throwing", () => {
    expect(roiPercent(50, 0)).toBe(0);
  });
  it("computes percent profit correctly", () => {
    expect(roiPercent(50, 100)).toBe(50);
  });
});

describe("itemCostBasis / costBasisPerUnit / remainingCostBasis", () => {
  it("sums purchase price and capitalised expenses from example in spec", () => {
    const item = baseItem({ purchasePrice: money(50) });
    const expenses: Expense[] = [
      { id: "e1", collectibleId: "c1", type: "shipping", amount: money(6), date: "2024-01-01", affectsCostBasis: true },
      { id: "e2", collectibleId: "c1", type: "grading", amount: money(45), date: "2024-01-05", affectsCostBasis: true },
      { id: "e3", collectibleId: "c1", type: "grading_shipping", amount: money(12), date: "2024-01-05", affectsCostBasis: true },
      { id: "e4", collectibleId: "c1", type: "supplies", amount: money(3), date: "2024-01-06", affectsCostBasis: true },
    ];
    expect(itemCostBasis(item, expenses)).toBe(116);
  });

  it("ignores expenses that don't affect cost basis", () => {
    const item = baseItem({ purchasePrice: money(50) });
    const expenses: Expense[] = [
      { id: "e1", collectibleId: "c1", type: "other", amount: money(999), date: "2024-01-01", affectsCostBasis: false },
    ];
    expect(itemCostBasis(item, expenses)).toBe(50);
  });

  it("uses allocated lot cost instead of purchase price when part of a lot", () => {
    const item = baseItem({ lotId: "lot1", allocatedLotCost: 150, purchasePrice: money(0) });
    expect(itemCostBasis(item, [])).toBe(150);
  });

  it("splits cost basis per unit across original quantity and scales to remaining quantity", () => {
    const item = baseItem({ purchasePrice: money(1800), quantity: 7, originalQuantity: 10 });
    expect(costBasisPerUnit(item, [])).toBe(180);
    expect(remainingCostBasis(item, [])).toBe(1260);
  });

  it("does not divide by zero when originalQuantity is 0", () => {
    const item = baseItem({ purchasePrice: money(100), quantity: 0, originalQuantity: 0 });
    expect(costBasisPerUnit(item, [])).toBe(100);
  });
});

describe("unrealisedGain / unrealisedRoi", () => {
  it("matches the worked example from the spec", () => {
    const item = baseItem({ purchasePrice: money(50), estimatedValue: 190, quantity: 1, originalQuantity: 1 });
    const expenses: Expense[] = [
      { id: "e1", collectibleId: "c1", type: "shipping", amount: money(6), date: "2024-01-01", affectsCostBasis: true },
      { id: "e2", collectibleId: "c1", type: "grading", amount: money(45), date: "2024-01-05", affectsCostBasis: true },
      { id: "e3", collectibleId: "c1", type: "grading_shipping", amount: money(12), date: "2024-01-05", affectsCostBasis: true },
      { id: "e4", collectibleId: "c1", type: "supplies", amount: money(3), date: "2024-01-06", affectsCostBasis: true },
    ];
    expect(unrealisedGain(item, expenses)).toBe(74);
    expect(unrealisedRoi(item, expenses)).toBeCloseTo(63.79, 1);
  });

  it("returns 0 ROI (not NaN) for a zero cost-basis item", () => {
    const item = baseItem({ purchasePrice: money(0), estimatedValue: 20 });
    expect(unrealisedRoi(item, [])).toBe(0);
  });
});

describe("estimateFees / breakEvenPrice", () => {
  it("estimates percentage + fixed fee", () => {
    expect(estimateFees(100, ebay)).toBe(13.3);
  });
  it("returns 0 when marketplace fees are disabled", () => {
    expect(estimateFees(100, { ...ebay, feesEnabled: false })).toBe(0);
  });
  it("returns 0 for an undefined marketplace (private sale, no fees)", () => {
    expect(estimateFees(100, undefined)).toBe(0);
  });
  it("computes a break-even price that nets back to cost basis after fees", () => {
    const be = breakEvenPrice(100, ebay, 0);
    const feesAtBe = estimateFees(be, ebay);
    expect(be - feesAtBe).toBeCloseTo(100, 1);
  });
});

describe("sale calculations (worked example from spec)", () => {
  const sale: SaleTransaction = {
    id: "s1",
    collectibleId: "c1",
    saleDate: "2024-06-01",
    salePrice: money(220),
    quantitySold: 1,
    marketplaceId: "m1",
    buyerShippingCharged: 0,
    sellerShippingCost: 8,
    marketplaceFee: 28,
    paymentProcessingFee: 7,
    otherFees: 0,
    feesOverridden: false,
    costBasisOfSoldUnits: 101,
    createdAt: "2024-06-01",
  };

  it("computes net proceeds", () => {
    expect(netProceeds(sale)).toBe(177);
  });
  it("computes realised profit", () => {
    expect(realisedProfit(sale)).toBe(76);
  });
  it("computes realised ROI", () => {
    expect(realisedRoi(sale)).toBeCloseTo(75.25, 1);
  });
});

describe("holdingPeriodDays / annualisedRoi", () => {
  it("computes whole days between dates", () => {
    expect(holdingPeriodDays("2024-01-01", "2024-01-31")).toBe(30);
  });
  it("returns the same ROI when days <= 0", () => {
    expect(annualisedRoi(50, 0)).toBe(50);
  });
  it("annualises a large ROI over a short holding period", () => {
    // 50% return in 30 days should annualise to a very large number
    const result = annualisedRoi(50, 30);
    expect(result).toBeGreaterThan(50);
  });
});

describe("allocateLotCost", () => {
  const items = [
    { id: "a", estimatedValue: 150, quantity: 1 },
    { id: "b", estimatedValue: 50, quantity: 1},
  ];

  it("splits evenly and the remainder lands on the last item so totals reconcile", () => {
    const result = allocateLotCost(100, items, "equal");
    expect(result.a + result.b).toBe(100);
    expect(result.a).toBe(50);
  });

  it("allocates proportionally to estimated value, matching the Charizard example", () => {
    const result = allocateLotCost(500, [{ id: "charizard", estimatedValue: 150, quantity: 1 }, { id: "rest", estimatedValue: 350, quantity: 1 }], "proportional");
    expect(result.charizard).toBe(150);
    expect(result.rest).toBe(350);
  });

  it("uses manual amounts as-is", () => {
    const result = allocateLotCost(100, [{ id: "a", estimatedValue: 0, quantity: 1, manualAmount: 40 }, { id: "b", estimatedValue: 0, quantity: 1, manualAmount: 60 }], "manual");
    expect(result).toEqual({ a: 40, b: 60 });
  });

  it("falls back to equal split when proportional total value is 0", () => {
    const result = allocateLotCost(100, [{ id: "a", estimatedValue: 0, quantity: 1 }, { id: "b", estimatedValue: 0, quantity: 1 }], "proportional");
    expect(result.a + result.b).toBe(100);
  });
});

describe("capitalRecovered", () => {
  it("flags full recovery once net cash recovered meets contributed capital", () => {
    const result = capitalRecovered(10000, 12000, 15000);
    expect(result.isFullyRecovered).toBe(true);
    expect(result.effectiveCollectionCost).toBe(-2000);
  });
  it("does not flag recovery when nothing has been sold", () => {
    const result = capitalRecovered(10000, 0, 15000);
    expect(result.isFullyRecovered).toBe(false);
    expect(result.percentRecovered).toBe(0);
  });
  it("handles zero contributed capital without dividing by zero", () => {
    const result = capitalRecovered(0, 0, 0);
    expect(result.percentRecovered).toBe(0);
  });
});

describe("costBasisForQuantity (partial sales)", () => {
  it("matches the booster box example from the spec", () => {
    const item = baseItem({ purchasePrice: money(1800), quantity: 7, originalQuantity: 10 });
    expect(costBasisForQuantity(item, [], 3)).toBe(540);
  });
});
