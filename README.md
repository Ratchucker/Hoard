# Hoard — Collectibles Profit/ROI Tracker

An investment-portfolio-style tracker for collectibles (trading cards to start; the data model
also covers sports cards, comics, LEGO, Funko, coins, and video games). The core question it
answers: **how much money have you actually made or lost from collecting**, after fees, shipping,
grading, and every other cost.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Zustand · Supabase · Recharts · Vitest

## Getting started

```bash
npm install
npm run dev
```

Without any setup, `npm run dev` still runs — the login page will say accounts aren't configured.
To enable real accounts (see **Auth**, below):

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor → New query**, paste in the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the one table the app
   needs and locks it down with Row Level Security.
3. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
4. Copy `.env.example` to `.env.local` and paste those two values in as `NEXT_PUBLIC_SUPABASE_URL`
   / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`. The login page now shows real sign-up/sign-in. Every new account is
   automatically seeded with ~18 realistic demo collectibles, sales, a lot purchase, a trade, and
   grading history, so the app looks complete immediately and they can edit or delete from there.

By default Supabase requires clicking an email confirmation link before a new account's first
sign-in works — fine for production, extra friction for a demo. To skip it: **Authentication →
Providers → Email → uncheck "Confirm email"** in the Supabase dashboard.

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
      store.ts           Zustand store — all CRUD, in-memory single source of truth
      sync.ts             Loads/saves the store to Supabase for the signed-in account
      selectors.ts        Derived dashboard/analytics metrics, built on top of calculations/
      seed.ts             Demo data generator (used to seed brand-new accounts)
    auth/
      store.ts           Supabase Auth session store (email + password)
    supabase/
      client.ts          Browser Supabase client (reads NEXT_PUBLIC_SUPABASE_* env vars)
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

The full client-side domain model (`src/lib/types.ts` — collectibles, expenses, sales, lots,
trades, grading submissions, wishlist, marketplaces, tags, attachments, valuation/activity
history) still lives entirely in the Zustand store (`src/lib/data/store.ts`); every mutation goes
through a single typed action (`addCollectible`, `recordSale`, `sendForGrading`, `recordTrade`,
`createLot`, …), and no UI component talks to Supabase directly.

Rather than normalizing that model into a dozen relational tables, each account gets **one row**
in a single `user_data` table holding its entire state as JSON (`supabase/schema.sql`). Row Level
Security policies (`auth.uid() = user_id`) mean a user can only ever read or write their own row —
enforced by Postgres, not by the client. `src/lib/data/sync.ts` fetches that row on sign-in
(seeding a fresh one via `buildSeedData()` for brand-new accounts) and debounce-saves the whole
store back to Supabase on every change. This keeps the migration from local-only to accounts small
and low-risk: the calculation engine, selectors, and every page are unaware persistence moved.

The one thing genuinely deferred for later: attachments (`Attachment.url`) still store images as
inline base64 data URIs rather than Supabase Storage — fine at today's scale, worth moving to
Storage if photo volume grows.

## Auth

`src/lib/auth/store.ts` wraps real Supabase Auth (email + password) — `supabase.auth.signUp`,
`signInWithPassword`, `signOut`, with session state driven by a single `onAuthStateChange`
listener that also triggers the data load/save wiring above. Without a configured Supabase project
(see **Getting started**), the login page shows a clear "accounts aren't set up" message instead of
a broken form.

## Pricing / valuation

Every collectible's `estimatedValue` is manual today (`estimatedValueIsManual`, with an
`estimatedValueUpdatedAt` timestamp shown in the UI). `src/lib/data/selectors.ts` and
`src/lib/calculations` never assume a pricing source — a future price-feed integration (the
placeholder tiles in Settings: PriceCharting, TCGplayer, CollX, Collectr) would just call
`updateEstimatedValue()` on a schedule.

## Not tax advice

The Reports & Export screen produces CSVs and a printable summary for personal record-keeping.
It is explicitly labeled as not tax advice.
