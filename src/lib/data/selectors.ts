// Derived, memoization-free selector functions that turn raw store state into
// the metrics the dashboard/analytics/collection screens need. Pure functions
// so they're easy to reason about and (if needed) unit test independently of React.

import {
  annualisedRoi,
  capitalRecovered,
  costBasisPerUnit,
  holdingPeriodDays,
  itemCostBasis,
  netProceeds,
  realisedProfit,
  realisedRoi,
  remainingCostBasis,
  roiPercent,
  unrealisedGain,
} from "@/lib/calculations";
import type { Collectible, Expense, SaleTransaction } from "@/lib/types";

export interface StoreSlice {
  collectibles: Collectible[];
  expenses: Expense[];
  sales: SaleTransaction[];
}

export function totalInvested(collectibles: Collectible[], expenses: Expense[]): number {
  return round2(collectibles.reduce((sum, c) => sum + itemCostBasis(c, expenses), 0));
}

export function currentCollectionValue(collectibles: Collectible[]): number {
  return round2(collectibles.reduce((sum, c) => sum + c.estimatedValue * c.quantity, 0));
}

export function totalUnrealisedGain(collectibles: Collectible[], expenses: Expense[]): number {
  return round2(
    collectibles.filter((c) => c.quantity > 0).reduce((sum, c) => sum + unrealisedGain(c, expenses), 0)
  );
}

export function totalRealisedProfit(sales: SaleTransaction[]): number {
  return round2(sales.reduce((sum, s) => sum + realisedProfit(s), 0));
}

export function lifetimeProfit(collectibles: Collectible[], expenses: Expense[], sales: SaleTransaction[]): number {
  return round2(totalUnrealisedGain(collectibles, expenses) + totalRealisedProfit(sales));
}

export function profitInRange(sales: SaleTransaction[], start: Date, end: Date): number {
  return round2(
    sales
      .filter((s) => {
        const d = new Date(s.saleDate);
        return d >= start && d <= end;
      })
      .reduce((sum, s) => sum + realisedProfit(s), 0)
  );
}

export function profitThisMonth(sales: SaleTransaction[]): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return profitInRange(sales, start, end);
}

export function totalSalesCount(sales: SaleTransaction[]): number {
  return sales.length;
}

export function averageRoi(sales: SaleTransaction[]): number {
  if (sales.length === 0) return 0;
  const rois = sales.map((s) => realisedRoi(s));
  return round2(rois.reduce((a, b) => a + b, 0) / rois.length);
}

export function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? round2((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

export interface SaleWithItem extends SaleTransaction {
  item?: Collectible;
  profit: number;
  roi: number;
}

export function salesWithDerived(sales: SaleTransaction[], collectibles: Collectible[]): SaleWithItem[] {
  return sales.map((s) => ({
    ...s,
    item: collectibles.find((c) => c.id === s.collectibleId),
    profit: realisedProfit(s),
    roi: realisedRoi(s),
  }));
}

export function bestSale(sales: SaleTransaction[], collectibles: Collectible[]): SaleWithItem | undefined {
  const withDerived = salesWithDerived(sales, collectibles);
  if (withDerived.length === 0) return undefined;
  return withDerived.reduce((best, s) => (s.profit > best.profit ? s : best), withDerived[0]);
}

export function worstSale(sales: SaleTransaction[], collectibles: Collectible[]): SaleWithItem | undefined {
  const withDerived = salesWithDerived(sales, collectibles);
  if (withDerived.length === 0) return undefined;
  return withDerived.reduce((worst, s) => (s.profit < worst.profit ? s : worst), withDerived[0]);
}

/** Money invested in items not yet fully recovered through sales. */
export function capitalAtRisk(collectibles: Collectible[], expenses: Expense[]): number {
  return round2(
    collectibles.filter((c) => c.quantity > 0).reduce((sum, c) => sum + remainingCostBasis(c, expenses), 0)
  );
}

export function capitalRecoveredSummary(collectibles: Collectible[], expenses: Expense[], sales: SaleTransaction[]) {
  const contributed = totalInvested(collectibles, expenses);
  const netRecovered = round2(sales.reduce((sum, s) => sum + netProceeds(s), 0));
  const remainingValue = currentCollectionValue(collectibles);
  return capitalRecovered(contributed, netRecovered, remainingValue);
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

/** Approximate portfolio value over time by walking purchase + valuation-history events. */
export function portfolioValueOverTime(collectibles: Collectible[], months = 12): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const value = collectibles.reduce((sum, c) => {
      const purchased = new Date(c.purchaseDate) <= endOfMonth;
      if (!purchased) return sum;
      return sum + c.estimatedValue * c.originalQuantity;
    }, 0);
    points.push({ date: d.toISOString().slice(0, 7), value: round2(value) });
  }
  return points;
}

export function investedVsCurrentOverTime(collectibles: Collectible[], expenses: Expense[], months = 12): { date: string; invested: number; current: number }[] {
  const now = new Date();
  const results: { date: string; invested: number; current: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const owned = collectibles.filter((c) => new Date(c.purchaseDate) <= endOfMonth);
    const invested = owned.reduce((sum, c) => sum + itemCostBasis(c, expenses), 0);
    const current = owned.reduce((sum, c) => sum + c.estimatedValue * c.originalQuantity, 0);
    results.push({ date: endOfMonth.toISOString().slice(0, 7), invested: round2(invested), current: round2(current) });
  }
  return results;
}

export function realisedProfitOverTime(sales: SaleTransaction[], months = 12): TimeSeriesPoint[] {
  const now = new Date();
  const points: TimeSeriesPoint[] = [];
  let cumulative = 0;
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    cumulative += profitInRange(sales, start, end);
    points.push({ date: start.toISOString().slice(0, 7), value: round2(cumulative) });
  }
  return points;
}

export function monthlyProfit(sales: SaleTransaction[], months = 12): TimeSeriesPoint[] {
  const now = new Date();
  const points: TimeSeriesPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    points.push({ date: start.toISOString().slice(0, 7), value: profitInRange(sales, start, end) });
  }
  return points;
}

export interface SlowMover {
  item: Collectible;
  costBasis: number;
  currentValue: number;
  gain: number;
  roi: number;
  daysHeld: number;
}

export function slowMovers(collectibles: Collectible[], expenses: Expense[], daysThreshold: number, roiThreshold: number): SlowMover[] {
  return collectibles
    .filter((c) => c.quantity > 0)
    .map((c) => {
      const costBasis = remainingCostBasis(c, expenses);
      const currentValue = c.estimatedValue * c.quantity;
      const gain = round2(currentValue - costBasis);
      const roi = roiPercent(gain, costBasis);
      const daysHeld = holdingPeriodDays(c.purchaseDate, new Date().toISOString());
      return { item: c, costBasis, currentValue, gain, roi, daysHeld };
    })
    .filter((s) => s.daysHeld >= daysThreshold && s.roi < roiThreshold)
    .sort((a, b) => b.daysHeld - a.daysHeld);
}

export function itemDaysHeld(item: Collectible): number {
  return holdingPeriodDays(item.purchaseDate, new Date().toISOString());
}

export function itemAnnualisedRoi(item: Collectible, expenses: Expense[]): number {
  const roi = roiPercent(unrealisedGain(item, expenses), remainingCostBasis(item, expenses));
  return annualisedRoi(roi, itemDaysHeld(item));
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export { itemCostBasis, costBasisPerUnit };
