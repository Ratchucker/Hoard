# Ledger — Collectibles Profit/ROI Tracker

An investment-portfolio-style tracker for collectibles (trading cards to start; the data model
also covers sports cards, comics, LEGO, Funko, coins, and video games). The core question it
answers: **how much money have you actually made or lost from collecting**, after fees, shipping,
grading, and every other cost.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Zustand · Recharts · Vitest

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Sign in with any name/email (see **Auth**, below) — the app seeds
itself with ~18 realistic demo collectibles, sales, a lot purchase, a trade, and grading history
so every screen is populated immediately.

Other useful scripts:

```bash
npm test       # run the financial-calculation unit test suite (vitest)
npm run build  # production build
npm run lint   # eslint
```

## Architecture

```
src/
  lib/
    types.ts            Domain model (Collectible, Expense, SaleTransaction, Lot, Trade, …)
    calculations/        Pure financial math: cost basis, ROI, break-even, lot allocation, etc.
                          (unit tested — see calculations/index.test.ts)
    data/
      store.ts           Zustand store — all CRUD, persisted to localStorage
      selectors.ts        Derived dashboard/analytics metrics, built on top of calculations/
      seed.ts             Demo data generator
    auth/
      store.ts           Local, Supabase-Auth-shaped session store
  components/
    ui/                  shadcn/ui primitives
    layout/               Sidebar (desktop), bottom nav + FAB (mobile), global Add menu
    dashboard/, collection/, shared/
  app/
    login/               Sign-in page
    (app)/                Authenticated route group — dashboard, collection, sales, grading,
                          lots, trades, wishlist, opportunity calculator, analytics, activity,
                          settings, import, reports
```

**Calculation logic is isolated from the UI.** Every dollar figure in the app (cost basis, ROI,
break-even price, capital recovered, lot allocation, partial-sale math, …) is computed by pure
functions in `src/lib/calculations`, independent of React or the store. That's what's covered by
the Vitest suite.

## Data layer / Supabase

No Docker was available in this environment, so the data layer runs entirely in the browser
(Zustand + `localStorage`) instead of against a live Supabase/Postgres instance. It was deliberately
built to mirror the schema this app is meant to run on:

- `src/lib/types.ts` — one interface per intended Postgres table (`collectibles`,
  `purchase_transactions` folded into `Collectible`, `expenses`, `sale_transactions`, `lots`,
  `lot_items` folded into `Collectible.lotId`, `trades`, `trade_items`, `grading_submissions`,
  `wishlist_items`, `marketplaces`, `tags`, `attachments`, `valuation_history`,
  `activity_events`).
- `src/lib/data/store.ts` — every mutation goes through a single, typed action (`addCollectible`,
  `recordSale`, `sendForGrading`, `recordTrade`, `createLot`, …). To swap in real Supabase: replace
  the `zustand`/`persist` implementation with Supabase queries inside these same action functions,
  add Row Level Security policies keyed on `auth.uid()`, and use Supabase Storage for
  `attachments.url`. No consuming component needs to change — they all just call `useStore()`.

## Auth

`src/lib/auth/store.ts` implements a minimal local session (name/email, no password) shaped after
Supabase Auth (`user`, `signIn`, `signOut`) specifically so it's a drop-in swap for
`@supabase/supabase-js`'s real auth client later. **This is not a security boundary** — there's no
password hashing or server verification; it's a single-device demo account.

## Pricing / valuation

Every collectible's `estimatedValue` is manual today (`estimatedValueIsManual`, with an
`estimatedValueUpdatedAt` timestamp shown in the UI). `src/lib/data/selectors.ts` and
`src/lib/calculations` never assume a pricing source — a future price-feed integration (the
placeholder tiles in Settings: PriceCharting, TCGplayer, CollX, Collectr) would just call
`updateEstimatedValue()` on a schedule.

## Not tax advice

The Reports & Export screen produces CSVs and a printable summary for personal record-keeping.
It is explicitly labeled as not tax advice.
