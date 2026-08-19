// Pure, reusable financial calculation functions.
// No React, no store access — everything here takes plain data in and returns plain data out,
// so it can be unit tested in isolation and reused by dashboard/analytics/detail views alike.

import { round2 } from "@/lib/types";
import type { Collectible, Expense, SaleTransaction, Marketplace } from "@/lib/types";

/** Safe division that returns 0 instead of NaN/Infinity when the denominator is 0. */
export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

export function roiPercent(profit: number, costBasis: number): number {
  return round2(safeDiv(profit, costBasis) * 100);
}

/**
 * Total cost basis for an item's full (original) quantity: purchase price plus every
 * capitalised cost (shipping, grading, authentication, allocated lot cost, attached expenses).
 */
export function itemCostBasis(item: Collectible, expenses: Expense[]): number {
  const attached = expenses
    .filter((e) => e.collectibleId === item.id && e.affectsCostBasis)
    .reduce((sum, e) => sum + e.amount.baseAmount, 0);
  const lotCost = item.allocatedLotCost ?? 0;
  const purchase = item.lotId ? 0 : item.purchasePrice.baseAmount;
  return round2(purchase + lotCost + attached);
}

/** Cost basis per single unit, based on the item's *original* quantity. */
export function costBasisPerUnit(item: Collectible, expenses: Expense[]): number {
  return safeDiv(itemCostBasis(item, expenses), item.originalQuantity || 1);
}

/** Cost basis remaining for currently-held (unsold) units. */
export function remainingCostBasis(item: Collectible, expenses: Expense[]): number {
  return round2(costBasisPerUnit(item, expenses) * item.quantity);
}

export function unrealisedGain(item: Collectible, expenses: Expense[]): number {
  const currentValue = item.estimatedValue * item.quantity;
  return round2(currentValue - remainingCostBasis(item, expenses));
}

export function unrealisedRoi(item: Collectible, expenses: Expense[]): number {
  return roiPercent(unrealisedGain(item, expenses), remainingCostBasis(item, expenses));
}

export interface FeeBreakdown {
  marketplaceFee: number;
  paymentProcessingFee: number;
  sellerShipping: number;
  otherFees: number;
}

/** Estimate marketplace fees for a given gross sale price using a marketplace preset. */
export function estimateFees(salePrice: number, marketplace: Marketplace | undefined): number {
  if (!marketplace || !marketplace.feesEnabled) return 0;
  return round2(salePrice * (marketplace.percentageFee / 100) + marketplace.fixedFee);
}

/** Gross sale price (sale amount + buyer-charged shipping). */
export function grossSalePrice(sale: Pick<SaleTransaction, "salePrice" | "buyerShippingCharged">): number {
  return round2(sale.salePrice.baseAmount + sale.buyerShippingCharged);
}

/** Net proceeds after all selling costs. */
export function netProceeds(
  sale: Pick<
    SaleTransaction,
    "salePrice" | "buyerShippingCharged" | "sellerShippingCost" | "marketplaceFee" | "paymentProcessingFee" | "otherFees"
  >
): number {
  return round2(
    grossSalePrice(sale) -
      sale.sellerShippingCost -
      sale.marketplaceFee -
      sale.paymentProcessingFee -
      sale.otherFees
  );
}

export function realisedProfit(sale: SaleTransaction): number {
  return round2(netProceeds(sale) - sale.costBasisOfSoldUnits);
}

export function realisedRoi(sale: SaleTransaction): number {
  return roiPercent(realisedProfit(sale), sale.costBasisOfSoldUnits);
}

export function holdingPeriodDays(purchaseDate: string, endDate: string): number {
  const start = new Date(purchaseDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/** Annualises an ROI given the number of days the position was held. */
export function annualisedRoi(roi: number, days: number): number {
  if (days <= 0) return roi;
  const years = days / 365;
  if (years <= 0) return roi;
  // Compound-growth annualisation: (1 + roi)^(1/years) - 1, guarding negative bases.
  const growth = 1 + roi / 100;
  if (growth <= 0) return -100;
  return round2((Math.pow(growth, 1 / years) - 1) * 100);
}

/**
 * Break-even sale price: the gross sale price at which net proceeds equal cost basis,
 * given a marketplace's percentage + fixed fee and expected seller shipping.
 * costBasis = price*(1-pct) - fixed - shipping  =>  price = (costBasis + fixed + shipping) / (1 - pct)
 */
export function breakEvenPrice(
  costBasis: number,
  marketplace: Marketplace | undefined,
  expectedShipping = 0
): number {
  const pct = marketplace?.feesEnabled ? marketplace.percentageFee / 100 : 0;
  const fixed = marketplace?.feesEnabled ? marketplace.fixedFee : 0;
  const denominator = 1 - pct;
  if (denominator <= 0) return Infinity;
  return round2((costBasis + fixed + expectedShipping) / denominator);
}

export interface BreakEvenResult {
  breakEvenPrice: number;
  currentValue: number;
  expectedNetProfitIfSoldNow: number;
  expectedRoi: number;
}

export function breakEvenSummary(
  costBasis: number,
  currentValue: number,
  marketplace: Marketplace | undefined,
  expectedShipping = 0
): BreakEvenResult {
  const be = breakEvenPrice(costBasis, marketplace, expectedShipping);
  const feesAtCurrent = estimateFees(currentValue, marketplace);
  const netIfSoldNow = round2(currentValue - feesAtCurrent - expectedShipping - costBasis);
  return {
    breakEvenPrice: be,
    currentValue,
    expectedNetProfitIfSoldNow: netIfSoldNow,
    expectedRoi: roiPercent(netIfSoldNow, costBasis),
  };
}

/** Lot cost allocation across items. Returns a map of collectibleId -> allocated cost basis. */
export interface LotAllocationInput {
  id: string;
  estimatedValue: number; // per unit
  quantity: number;
  manualAmount?: number; // used only for "manual" method
}

export function allocateLotCost(
  totalCost: number,
  items: LotAllocationInput[],
  method: "equal" | "manual" | "proportional"
): Record<string, number> {
  const result: Record<string, number> = {};
  if (items.length === 0) return result;

  if (method === "manual") {
    for (const item of items) result[item.id] = round2(item.manualAmount ?? 0);
    return result;
  }

  if (method === "equal") {
    const share = totalCost / items.length;
    let allocated = 0;
    items.forEach((item, idx) => {
      const amount = idx === items.length - 1 ? round2(totalCost - allocated) : round2(share);
      allocated = round2(allocated + amount);
      result[item.id] = amount;
    });
    return result;
  }

  // proportional, based on estimated market value
  const totalValue = items.reduce((sum, i) => sum + i.estimatedValue * i.quantity, 0);
  if (totalValue <= 0) return allocateLotCost(totalCost, items, "equal");
  let allocated = 0;
  items.forEach((item, idx) => {
    const itemValue = item.estimatedValue * item.quantity;
    const amount =
      idx === items.length - 1
        ? round2(totalCost - allocated)
        : round2(totalCost * (itemValue / totalValue));
    allocated = round2(allocated + amount);
    result[item.id] = amount;
  });
  return result;
}

/** Capital recovered: net proceeds from sales vs. total money contributed (purchases + expenses). */
export interface CapitalRecoveredResult {
  totalContributed: number;
  netCashRecovered: number;
  remainingCollectionValue: number;
  percentRecovered: number; // 0-100+, capped display-side if desired
  effectiveCollectionCost: number; // totalContributed - netCashRecovered (negative once fully recovered)
  isFullyRecovered: boolean;
}

export function capitalRecovered(
  totalContributed: number,
  netCashRecovered: number,
  remainingCollectionValue: number
): CapitalRecoveredResult {
  return {
    totalContributed: round2(totalContributed),
    netCashRecovered: round2(netCashRecovered),
    remainingCollectionValue: round2(remainingCollectionValue),
    percentRecovered: totalContributed > 0 ? round2(Math.min(999, (netCashRecovered / totalContributed) * 100)) : 0,
    effectiveCollectionCost: round2(totalContributed - netCashRecovered),
    isFullyRecovered: netCashRecovered >= totalContributed && totalContributed > 0,
  };
}

/** Partial-sale cost-basis split: cost basis attributable to the units being sold now. */
export function costBasisForQuantity(item: Collectible, expenses: Expense[], quantitySold: number): number {
  return round2(costBasisPerUnit(item, expenses) * quantitySold);
}
