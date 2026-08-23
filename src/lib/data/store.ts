"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import {
  costBasisForQuantity,
  costBasisPerUnit,
  estimateFees,
  itemCostBasis,
} from "@/lib/calculations";
import { money, round2 } from "@/lib/types";
import { formatCurrency as formatMoney } from "@/lib/format";
import type {
  ActivityEvent,
  Attachment,
  Collectible,
  Expense,
  GradingStatus,
  GradingSubmission,
  ID,
  ImportTemplate,
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
import { buildSeedData } from "@/lib/data/seed";

interface StoreState {
  hydrated: boolean;
  collectibles: Collectible[];
  expenses: Expense[];
  sales: SaleTransaction[];
  marketplaces: Marketplace[];
  gradingSubmissions: GradingSubmission[];
  lots: Lot[];
  trades: Trade[];
  tradeItems: TradeItem[];
  wishlist: WishlistItem[];
  tags: Tag[];
  attachments: Attachment[];
  timelineEvents: TimelineEvent[];
  activityEvents: ActivityEvent[];
  valuationHistory: ValuationHistoryEntry[];
  settings: Settings;
  importTemplates: ImportTemplate[];

  // Collectibles
  addCollectible: (input: NewCollectibleInput, options?: AddCollectibleOptions) => ID;
  updateCollectible: (id: ID, patch: Partial<Collectible>) => void;
  updateEstimatedValue: (id: ID, value: number, isManual?: boolean) => void;
  deleteCollectible: (id: ID) => void;

  // Expenses
  addExpense: (input: Omit<Expense, "id">) => ID;

  // Sales
  recordSale: (input: RecordSaleInput) => ID;

  // Marketplaces
  addMarketplace: (input: Omit<Marketplace, "id">) => ID;
  updateMarketplace: (id: ID, patch: Partial<Marketplace>) => void;
  deleteMarketplace: (id: ID) => void;

  // Grading
  sendForGrading: (input: SendForGradingInput) => ID;
  updateGradingStatus: (id: ID, status: GradingStatus) => void;
  returnFromGrading: (id: ID, input: ReturnFromGradingInput) => void;

  // Lots
  createLot: (input: NewLotInput) => ID;

  // Trades
  recordTrade: (input: NewTradeInput) => ID;

  // Wishlist
  addWishlistItem: (input: Omit<WishlistItem, "id" | "createdAt">) => ID;
  updateWishlistItem: (id: ID, patch: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: ID) => void;

  // Tags
  addTag: (name: string, color: string) => ID;

  // Attachments
  addAttachment: (input: Omit<Attachment, "id" | "createdAt">) => ID;

  // Settings
  updateSettings: (patch: Partial<Settings>) => void;

  // Import templates
  saveImportTemplate: (name: string, mapping: Record<string, string>) => ID;
  deleteImportTemplate: (id: ID) => void;

  // Utility
  resetToSeed: () => void;
  logActivity: (event: Omit<ActivityEvent, "id">) => void;
}

export interface NewCollectibleInput
  extends Omit<
    Collectible,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "status"
    | "estimatedValueUpdatedAt"
    | "quantity"
    | "originalQuantity"
  > {
  quantity: number;
}

export interface AddCollectibleOptions {
  /** Overrides the default "Purchased for $X" timeline entry — for non-cash acquisitions (trades, lot splits). */
  timelineDescription?: string;
  /** Overrides the default "Purchased X" activity-log entry. */
  activityDescription?: string;
}

export interface RecordSaleInput {
  collectibleId: ID;
  saleDate: string;
  salePrice: number;
  currency?: string;
  exchangeRate?: number;
  quantitySold: number;
  marketplaceId: ID;
  buyerShippingCharged: number;
  sellerShippingCost: number;
  marketplaceFeeOverride?: number;
  paymentProcessingFee: number;
  otherFees: number;
  notes?: string;
}

export interface SendForGradingInput {
  collectibleId: ID;
  company: string;
  submissionDate: string;
  gradingFee: number;
  shippingCost: number;
  insurance: number;
  otherCosts: number;
  referenceNumber?: string;
  notes?: string;
}

export interface ReturnFromGradingInput {
  grade: string;
  returnDate: string;
  valueAfterGrading: number;
}

export interface NewLotInput {
  name: string;
  purchaseDate: string;
  totalCost: number;
  currency?: string;
  source: Lot["source"];
  seller?: string;
  notes?: string;
  allocationMethod: Lot["allocationMethod"];
}

export interface NewTradeInput {
  date: string;
  counterparty?: string;
  cashAdded: number;
  cashReceived: number;
  fees: number;
  shipping: number;
  notes?: string;
  given: { collectibleId: ID; estimatedValue: number }[];
  received: NewCollectibleInput[]; // items received are created as new collectibles
}

function nowIso() {
  return new Date().toISOString();
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...buildSeedData(),

      addCollectible: (input, options) => {
        const id = uuid();
        const ts = nowIso();
        const collectible: Collectible = {
          ...input,
          id,
          originalQuantity: input.quantity,
          status: "owned",
          estimatedValueUpdatedAt: ts,
          createdAt: ts,
          updatedAt: ts,
        } as Collectible;
        set((s) => ({ collectibles: [...s.collectibles, collectible] }));
        get().logActivity({
          date: input.purchaseDate,
          type: "purchase",
          description:
            options?.activityDescription ??
            `Purchased ${input.name}${input.quantity > 1 ? ` x${input.quantity}` : ""}`,
          amount: input.purchasePrice.baseAmount,
          collectibleId: id,
        });
        set((s) => ({
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: uuid(),
              collectibleId: id,
              type: "purchased",
              date: input.purchaseDate,
              description: options?.timelineDescription ?? `Purchased for ${input.purchasePrice.baseAmount}`,
            },
          ],
        }));
        return id;
      },

      updateCollectible: (id, patch) => {
        set((s) => ({
          collectibles: s.collectibles.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: nowIso() } : c
          ),
        }));
      },

      updateEstimatedValue: (id, value, isManual = true) => {
        const ts = nowIso();
        set((s) => ({
          collectibles: s.collectibles.map((c) =>
            c.id === id
              ? { ...c, estimatedValue: value, estimatedValueUpdatedAt: ts, estimatedValueIsManual: isManual, updatedAt: ts }
              : c
          ),
          valuationHistory: [
            ...s.valuationHistory,
            { id: uuid(), collectibleId: id, value, date: ts, isManual },
          ],
          timelineEvents: [
            ...s.timelineEvents,
            { id: uuid(), collectibleId: id, type: "value_updated", date: ts, description: `Estimated value updated to ${value}` },
          ],
        }));
      },

      deleteCollectible: (id) => {
        set((s) => ({ collectibles: s.collectibles.filter((c) => c.id !== id) }));
      },

      addExpense: (input) => {
        const id = uuid();
        set((s) => ({ expenses: [...s.expenses, { ...input, id }] }));
        get().logActivity({
          date: input.date,
          type: "expense",
          description: `${input.description || input.type} expense added`,
          amount: input.amount.baseAmount,
          collectibleId: input.collectibleId,
        });
        if (input.collectibleId) {
          set((s) => ({
            timelineEvents: [
              ...s.timelineEvents,
              {
                id: uuid(),
                collectibleId: input.collectibleId!,
                type: "expense_added",
                date: input.date,
                description: `${input.type} expense: ${input.amount.baseAmount}`,
              },
            ],
          }));
        }
        return id;
      },

      recordSale: (input) => {
        const state = get();
        const item = state.collectibles.find((c) => c.id === input.collectibleId);
        if (!item) throw new Error("Collectible not found");
        const marketplace = state.marketplaces.find((m) => m.id === input.marketplaceId);
        const saleMoney = money(input.salePrice, input.currency ?? "USD", input.exchangeRate ?? 1);
        const marketplaceFee =
          input.marketplaceFeeOverride ?? estimateFees(saleMoney.baseAmount, marketplace);
        const costBasis = costBasisForQuantity(item, state.expenses, input.quantitySold);

        const id = uuid();
        const sale: SaleTransaction = {
          id,
          collectibleId: input.collectibleId,
          saleDate: input.saleDate,
          salePrice: saleMoney,
          quantitySold: input.quantitySold,
          marketplaceId: input.marketplaceId,
          buyerShippingCharged: input.buyerShippingCharged,
          sellerShippingCost: input.sellerShippingCost,
          marketplaceFee,
          paymentProcessingFee: input.paymentProcessingFee,
          otherFees: input.otherFees,
          feesOverridden: input.marketplaceFeeOverride !== undefined,
          notes: input.notes,
          costBasisOfSoldUnits: costBasis,
          createdAt: nowIso(),
        };

        const remainingQty = item.quantity - input.quantitySold;
        set((s) => ({
          sales: [...s.sales, sale],
          collectibles: s.collectibles.map((c) =>
            c.id === item.id
              ? {
                  ...c,
                  quantity: Math.max(0, remainingQty),
                  status: remainingQty <= 0 ? "sold" : "partially_sold",
                  updatedAt: nowIso(),
                }
              : c
          ),
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: uuid(),
              collectibleId: item.id,
              type: "sold",
              date: input.saleDate,
              description: `Sold ${input.quantitySold} for ${saleMoney.baseAmount}`,
            },
          ],
        }));

        get().logActivity({
          date: input.saleDate,
          type: "sale",
          description: `Sold ${item.name}${input.quantitySold > 1 ? ` x${input.quantitySold}` : ""}`,
          amount: saleMoney.baseAmount,
          collectibleId: item.id,
        });

        return id;
      },

      addMarketplace: (input) => {
        const id = uuid();
        set((s) => ({ marketplaces: [...s.marketplaces, { ...input, id }] }));
        return id;
      },
      updateMarketplace: (id, patch) => {
        set((s) => ({ marketplaces: s.marketplaces.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
      },
      deleteMarketplace: (id) => {
        set((s) => ({ marketplaces: s.marketplaces.filter((m) => m.id !== id) }));
      },

      sendForGrading: (input) => {
        const id = uuid();
        const state = get();
        const item = state.collectibles.find((c) => c.id === input.collectibleId);
        const submission: GradingSubmission = {
          id,
          collectibleId: input.collectibleId,
          company: input.company,
          submissionDate: input.submissionDate,
          gradingFee: input.gradingFee,
          shippingCost: input.shippingCost,
          insurance: input.insurance,
          otherCosts: input.otherCosts,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          status: "sent",
          valueBeforeGrading: item?.estimatedValue,
        };
        set((s) => ({ gradingSubmissions: [...s.gradingSubmissions, submission] }));

        const totalCost = input.gradingFee + input.shippingCost + input.insurance + input.otherCosts;
        get().addExpense({
          collectibleId: input.collectibleId,
          type: "grading",
          description: `${input.company} grading submission`,
          amount: money(totalCost),
          date: input.submissionDate,
          affectsCostBasis: true,
        });

        set((s) => ({
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: uuid(),
              collectibleId: input.collectibleId,
              type: "sent_for_grading",
              date: input.submissionDate,
              description: `Sent to ${input.company} for grading`,
            },
          ],
        }));
        get().logActivity({
          date: input.submissionDate,
          type: "grading_submitted",
          description: `Sent to ${input.company} for grading`,
          amount: totalCost,
          collectibleId: input.collectibleId,
        });

        return id;
      },

      updateGradingStatus: (id, status) => {
        set((s) => ({
          gradingSubmissions: s.gradingSubmissions.map((g) => (g.id === id ? { ...g, status } : g)),
        }));
      },

      returnFromGrading: (id, input) => {
        const state = get();
        const submission = state.gradingSubmissions.find((g) => g.id === id);
        if (!submission) return;
        set((s) => ({
          gradingSubmissions: s.gradingSubmissions.map((g) =>
            g.id === id
              ? { ...g, status: "returned", grade: input.grade, returnDate: input.returnDate, valueAfterGrading: input.valueAfterGrading }
              : g
          ),
          collectibles: s.collectibles.map((c) =>
            c.id === submission.collectibleId
              ? {
                  ...c,
                  isGraded: true,
                  gradingCompany: submission.company,
                  grade: input.grade,
                  estimatedValue: input.valueAfterGrading,
                  estimatedValueUpdatedAt: nowIso(),
                  condition: "not_applicable",
                  updatedAt: nowIso(),
                }
              : c
          ),
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: uuid(),
              collectibleId: submission.collectibleId,
              type: "grade_received",
              date: input.returnDate,
              description: `Returned graded ${submission.company} ${input.grade}`,
            },
          ],
        }));
        get().logActivity({
          date: input.returnDate,
          type: "grading_returned",
          description: `Received ${submission.company} ${input.grade} grade`,
          collectibleId: submission.collectibleId,
        });
      },

      createLot: (input) => {
        const id = uuid();
        const lot: Lot = {
          id,
          name: input.name,
          purchaseDate: input.purchaseDate,
          totalCost: money(input.totalCost, input.currency ?? "USD"),
          source: input.source,
          seller: input.seller,
          notes: input.notes,
          allocationMethod: input.allocationMethod,
        };
        set((s) => ({ lots: [...s.lots, lot] }));
        get().logActivity({
          date: input.purchaseDate,
          type: "lot_purchase",
          description: `Bought lot: ${input.name}`,
          amount: lot.totalCost.baseAmount,
          lotId: id,
        });
        return id;
      },

      recordTrade: (input) => {
        const id = uuid();
        const state = get();
        const trade: Trade = {
          id,
          date: input.date,
          counterparty: input.counterparty,
          cashAdded: input.cashAdded,
          cashReceived: input.cashReceived,
          fees: input.fees,
          shipping: input.shipping,
          notes: input.notes,
          createdAt: nowIso(),
        };

        const tradeItems: TradeItem[] = [];
        const givenBreakdown: { name: string; costBasis: number }[] = [];
        for (const g of input.given) {
          const item = state.collectibles.find((c) => c.id === g.collectibleId);
          const costBasis = item ? costBasisPerUnit(item, state.expenses) * item.quantity : 0;
          givenBreakdown.push({ name: item?.name ?? "traded item", costBasis: round2(costBasis) });
          tradeItems.push({
            id: uuid(),
            tradeId: id,
            collectibleId: g.collectibleId,
            direction: "given",
            estimatedValue: g.estimatedValue,
            costBasisAtTrade: costBasis,
          });
        }

        // Human-readable breakdown of how the received item's transferred cost basis was
        // derived, so it doesn't look like an unexplained number on the item detail page.
        const positiveParts = [
          ...givenBreakdown.map((g) => `${formatMoney(g.costBasis)} cost basis of ${g.name}`),
          input.cashAdded > 0 ? `${formatMoney(input.cashAdded)} cash added` : null,
          input.fees > 0 ? `${formatMoney(input.fees)} fees` : null,
          input.shipping > 0 ? `${formatMoney(input.shipping)} shipping` : null,
        ].filter((p): p is string => Boolean(p));
        let breakdownText = positiveParts.length > 0 ? positiveParts.join(" + ") : undefined;
        if (input.cashReceived > 0 && breakdownText) {
          breakdownText += ` − ${formatMoney(input.cashReceived)} cash received`;
        }

        const receivedIds: ID[] = [];
        for (const r of input.received) {
          const newId = get().addCollectible(
            { ...r, purchaseSource: "private_sale", purchaseNotes: `Received via trade` },
            {
              timelineDescription: `Received via trade${input.counterparty ? ` with ${input.counterparty}` : ""}${
                breakdownText ? ` — cost basis: ${breakdownText}` : ""
              }`,
              activityDescription: `Received ${r.name} via trade`,
            }
          );
          receivedIds.push(newId);
          tradeItems.push({
            id: uuid(),
            tradeId: id,
            collectibleId: newId,
            direction: "received",
            estimatedValue: r.estimatedValue,
          });
        }

        set((s) => ({
          trades: [...s.trades, trade],
          tradeItems: [...s.tradeItems, ...tradeItems],
          collectibles: s.collectibles.map((c) =>
            input.given.some((g) => g.collectibleId === c.id)
              ? { ...c, status: "traded_away" as const, quantity: 0, updatedAt: nowIso() }
              : c
          ),
        }));

        for (const g of input.given) {
          set((s) => ({
            timelineEvents: [
              ...s.timelineEvents,
              { id: uuid(), collectibleId: g.collectibleId, type: "traded", date: input.date, description: `Traded away (est. value ${g.estimatedValue})` },
            ],
          }));
        }

        get().logActivity({
          date: input.date,
          type: "trade",
          description: `Trade recorded${input.counterparty ? ` with ${input.counterparty}` : ""}`,
          tradeId: id,
        });

        return id;
      },

      addWishlistItem: (input) => {
        const id = uuid();
        set((s) => ({ wishlist: [...s.wishlist, { ...input, id, createdAt: nowIso() }] }));
        return id;
      },
      updateWishlistItem: (id, patch) => {
        set((s) => ({ wishlist: s.wishlist.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
      },
      deleteWishlistItem: (id) => {
        set((s) => ({ wishlist: s.wishlist.filter((w) => w.id !== id) }));
      },

      addTag: (name, color) => {
        const id = uuid();
        set((s) => ({ tags: [...s.tags, { id, name, color }] }));
        return id;
      },

      addAttachment: (input) => {
        const id = uuid();
        set((s) => ({ attachments: [...s.attachments, { ...input, id, createdAt: nowIso() }] }));
        return id;
      },

      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      saveImportTemplate: (name, mapping) => {
        const templateId = uuid();
        set((s) => ({ importTemplates: [...s.importTemplates, { id: templateId, name, mapping, createdAt: nowIso() }] }));
        return templateId;
      },
      deleteImportTemplate: (templateId) => {
        set((s) => ({ importTemplates: s.importTemplates.filter((t) => t.id !== templateId) }));
      },

      resetToSeed: () => {
        set({ ...buildSeedData() });
      },

      logActivity: (event) => {
        set((s) => ({ activityEvents: [...s.activityEvents, { ...event, id: uuid() }] }));
      },
    }),
    {
      name: "card-roi-app-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

export function itemTotalCostBasis(item: Collectible, expenses: Expense[]) {
  return itemCostBasis(item, expenses);
}

export { round2 };
