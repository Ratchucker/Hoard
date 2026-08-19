"use client";

import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { StatTile } from "@/components/shared/stat-tile";
import { PnlText } from "@/components/shared/pnl-text";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatSignedCurrency, formatSignedPercent } from "@/lib/format";
import {
  averageRoi,
  bestSale,
  capitalAtRisk,
  capitalRecoveredSummary,
  currentCollectionValue,
  investedVsCurrentOverTime,
  lifetimeProfit,
  monthlyProfit,
  portfolioValueOverTime,
  profitThisMonth,
  realisedProfitOverTime,
  totalInvested,
  totalRealisedProfit,
  totalSalesCount,
  totalUnrealisedGain,
  worstSale,
} from "@/lib/data/selectors";
import { InvestedVsCurrentChart, MonthlyProfitChart, PortfolioValueChart, RealisedProfitChart } from "@/components/dashboard/charts";
import { Trophy, TrendingDown as TrendingDownIcon, ShieldAlert, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <LoadingGate>
      <DashboardContent />
    </LoadingGate>
  );
}

function DashboardContent() {
  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);
  const sales = useStore((s) => s.sales);

  const collectionValue = currentCollectionValue(collectibles);
  const invested = totalInvested(collectibles, expenses);
  const unrealised = totalUnrealisedGain(collectibles, expenses);
  const realised = totalRealisedProfit(sales);
  const lifetime = lifetimeProfit(collectibles, expenses, sales);
  const thisMonth = profitThisMonth(sales);
  const salesCount = totalSalesCount(sales);
  const avgRoi = averageRoi(sales);

  const best = bestSale(sales, collectibles);
  const worst = worstSale(sales, collectibles);
  const atRisk = capitalAtRisk(collectibles, expenses);
  const recovery = capitalRecoveredSummary(collectibles, expenses, sales);

  const portfolioSeries = portfolioValueOverTime(collectibles);
  const realisedSeries = realisedProfitOverTime(sales);
  const monthlySeries = monthlyProfit(sales);
  const investedVsCurrent = investedVsCurrentOverTime(collectibles, expenses);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="How much money you've actually made or lost from collecting." />

      {/* Hero */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-6 md:p-8">
          <p className="text-sm font-medium text-muted-foreground">Current Collection Value</p>
          <p className="mt-2 text-4xl md:text-5xl font-bold tracking-tight tabular-nums">{formatCurrency(collectionValue)}</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat label="Total Invested" value={formatCurrency(invested)} />
            <MiniStat label="Unrealised Gain" value={<PnlText value={unrealised} />} />
            <MiniStat label="Realised Profit" value={<PnlText value={realised} />} />
            <MiniStat label="Lifetime Profit" value={<PnlText value={lifetime} />} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Profit This Month" value={<PnlText value={thisMonth} />} />
        <StatTile label="Total Sales" value={salesCount} />
        <StatTile label="Average ROI" value={formatSignedPercent(avgRoi)} valueClassName={avgRoi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} />
        <StatTile label="Capital Still at Risk" value={formatCurrency(atRisk)} sublabel="Invested, not yet recovered" icon={ShieldAlert} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioValueChart data={portfolioSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Realised Profit Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <RealisedProfitChart data={realisedSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyProfitChart data={monthlySeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invested vs Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestedVsCurrentChart data={investedVsCurrent} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {best?.item ? (
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Trophy className="size-4 text-amber-500" />
              <CardTitle className="text-sm font-medium">Best Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/collection/${best.item.id}`} className="font-medium hover:underline">
                {best.item.name}
              </Link>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Sale price {formatCurrency(best.salePrice.baseAmount)}</span>
                <PnlText value={best.profit} percent={best.roi} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Trophy className="size-4 text-amber-500" />
              <CardTitle className="text-sm font-medium">Best Sale</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">No sales recorded yet.</CardContent>
          </Card>
        )}

        {worst?.item ? (
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <TrendingDownIcon className="size-4 text-red-500" />
              <CardTitle className="text-sm font-medium">Worst Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/collection/${worst.item.id}`} className="font-medium hover:underline">
                {worst.item.name}
              </Link>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Sale price {formatCurrency(worst.salePrice.baseAmount)}</span>
                <PnlText value={worst.profit} percent={worst.roi} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <TrendingDownIcon className="size-4 text-red-500" />
              <CardTitle className="text-sm font-medium">Worst Sale</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">No sales recorded yet.</CardContent>
          </Card>
        )}
      </div>

      <Card className={recovery.isFullyRecovered ? "border-emerald-500/40 bg-emerald-500/5" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Collection Paid For
            {recovery.isFullyRecovered && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 gap-1">
                <PartyPopper className="size-3" /> Fully recovered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="text-muted-foreground">Total contributed</p>
              <p className="font-semibold tabular-nums">{formatCurrency(recovery.totalContributed)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net cash recovered</p>
              <p className="font-semibold tabular-nums">{formatCurrency(recovery.netCashRecovered)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining collection value</p>
              <p className="font-semibold tabular-nums">{formatCurrency(recovery.remainingCollectionValue)}</p>
            </div>
          </div>
          <Progress value={Math.min(100, recovery.percentRecovered)} className="h-2.5" />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{recovery.percentRecovered.toFixed(0)}% of original capital recovered</span>
            <span className={recovery.effectiveCollectionCost <= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground font-medium"}>
              Effective collection cost: {formatSignedCurrency(recovery.effectiveCollectionCost)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
