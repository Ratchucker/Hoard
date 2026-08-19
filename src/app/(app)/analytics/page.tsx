"use client";

import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatSignedCurrency, formatSignedPercent } from "@/lib/format";
import { holdingPeriodDays, realisedProfit, realisedRoi } from "@/lib/calculations";
import { medianOf } from "@/lib/data/selectors";
import { CATEGORY_LABELS, PURCHASE_SOURCE_LABELS, type Category, type PurchaseSource } from "@/lib/types";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TrendingUp, ArrowRight } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <LoadingGate>
      <AnalyticsContent />
    </LoadingGate>
  );
}

function groupSum<T>(items: T[], keyFn: (t: T) => string, valueFn: (t: T) => number): { key: string; value: number; count: number }[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key) ?? { value: 0, count: 0 };
    existing.value += valueFn(item);
    existing.count += 1;
    map.set(key, existing);
  }
  return Array.from(map.entries()).map(([key, v]) => ({ key, ...v })).sort((a, b) => b.value - a.value);
}

function AnalyticsContent() {
  const sales = useStore((s) => s.sales);
  const collectibles = useStore((s) => s.collectibles);
  const marketplaces = useStore((s) => s.marketplaces);
  const gradingSubmissions = useStore((s) => s.gradingSubmissions);

  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  const filteredSales = sales.filter((s) => {
    if (start && s.saleDate < start) return false;
    if (end && s.saleDate > end) return false;
    return true;
  });

  const profits = filteredSales.map((s) => realisedProfit(s));
  const totalProfit = profits.reduce((a, b) => a + b, 0);
  const avgProfit = filteredSales.length ? totalProfit / filteredSales.length : 0;
  const medianProfit = medianOf(profits);
  const rois = filteredSales.map((s) => realisedRoi(s));
  const avgRoi = rois.length ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;
  const wins = filteredSales.filter((s) => realisedProfit(s) > 0).length;
  const winRate = filteredSales.length ? (wins / filteredSales.length) * 100 : 0;
  const holdingDays = filteredSales.map((s) => {
    const item = collectibles.find((c) => c.id === s.collectibleId);
    return item ? holdingPeriodDays(item.purchaseDate, s.saleDate) : 0;
  });
  const avgHolding = holdingDays.length ? holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length : 0;
  const highestRoi = rois.length ? Math.max(...rois) : 0;
  const largestProfit = profits.length ? Math.max(...profits) : 0;
  const largestLoss = profits.length ? Math.min(...profits) : 0;
  const gradingSpend = gradingSubmissions.reduce((sum, g) => sum + g.gradingFee + g.shippingCost + g.insurance + g.otherCosts, 0);

  const gradedSaleIds = new Set(
    filteredSales.filter((s) => collectibles.find((c) => c.id === s.collectibleId)?.isGraded).map((s) => s.id)
  );
  const profitFromGraded = filteredSales.filter((s) => gradedSaleIds.has(s.id)).reduce((sum, s) => sum + realisedProfit(s), 0);
  const profitFromRaw = totalProfit - profitFromGraded;

  const byCategory = groupSum(
    filteredSales,
    (s) => {
      const item = collectibles.find((c) => c.id === s.collectibleId);
      return item ? CATEGORY_LABELS[item.category as Category] : "Unknown";
    },
    (s) => realisedProfit(s)
  );
  const bySet = groupSum(
    filteredSales,
    (s) => collectibles.find((c) => c.id === s.collectibleId)?.set ?? "Unknown",
    (s) => realisedProfit(s)
  );
  const byRawGraded = groupSum(
    filteredSales,
    (s) => (collectibles.find((c) => c.id === s.collectibleId)?.isGraded ? "Graded" : "Raw"),
    (s) => realisedProfit(s)
  );
  const byGradingCompany = groupSum(
    filteredSales.filter((s) => collectibles.find((c) => c.id === s.collectibleId)?.isGraded),
    (s) => collectibles.find((c) => c.id === s.collectibleId)?.gradingCompany ?? "Unknown",
    (s) => realisedProfit(s)
  );
  const byMarketplace = groupSum(
    filteredSales,
    (s) => marketplaces.find((m) => m.id === s.marketplaceId)?.name ?? "Unknown",
    (s) => realisedProfit(s)
  );
  const bySource = groupSum(
    filteredSales,
    (s) => {
      const source = collectibles.find((c) => c.id === s.collectibleId)?.purchaseSource;
      return PURCHASE_SOURCE_LABELS[(source ?? "other") as PurchaseSource];
    },
    (s) => realisedProfit(s)
  );
  const byMonth = groupSum(
    filteredSales,
    (s) => s.saleDate.slice(0, 7),
    (s) => realisedProfit(s)
  ).sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Profitability breakdowns across your whole trading history."
        actions={
          <div className="flex items-center gap-2">
            <Input type="date" className="w-36" value={start} onChange={(e) => setStart(e.target.value)} />
            <ArrowRight className="size-4 text-muted-foreground" />
            <Input type="date" className="w-36" value={end} onChange={(e) => setEnd(e.target.value)} />
            {(start || end) && <Button variant="ghost" size="sm" onClick={() => { setStart(""); setEnd(""); }}>Clear</Button>}
            <Button asChild size="sm" variant="outline"><Link href="/reports">Export report</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Realised Profit" value={formatSignedCurrency(totalProfit)} />
        <StatTile label="Total Sales" value={filteredSales.length} />
        <StatTile label="Win Rate" value={`${winRate.toFixed(0)}%`} />
        <StatTile label="Average ROI" value={formatSignedPercent(avgRoi)} />
        <StatTile label="Average Profit / Sale" value={formatSignedCurrency(avgProfit)} />
        <StatTile label="Median Profit / Sale" value={formatSignedCurrency(medianProfit)} />
        <StatTile label="Average Holding Period" value={`${avgHolding.toFixed(0)}d`} />
        <StatTile label="Highest ROI" value={formatSignedPercent(highestRoi)} />
        <StatTile label="Largest $ Profit" value={formatSignedCurrency(largestProfit)} />
        <StatTile label="Largest $ Loss" value={formatSignedCurrency(largestLoss)} />
        <StatTile label="Grading Spend" value={formatCurrency(gradingSpend)} />
        <StatTile label="Profit: Graded vs Raw" value={`${formatSignedCurrency(profitFromGraded)} / ${formatSignedCurrency(profitFromRaw)}`} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Realised Profit by Month</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byMonth.map((d) => ({ ...d, label: d.key }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byMonth.map((d, i) => <Cell key={i} fill={d.value >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <BreakdownCard title="By Category" rows={byCategory} />
        <BreakdownCard title="By Set" rows={bySet.slice(0, 8)} />
        <BreakdownCard title="Raw vs Graded" rows={byRawGraded} />
        <BreakdownCard title="By Grading Company" rows={byGradingCompany} empty="No graded item sales in range." />
        <BreakdownCard title="By Marketplace Sold" rows={byMarketplace} />
        <BreakdownCard title="By Purchase Source" rows={bySource} />
      </div>

      {filteredSales.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No sales in this date range yet.</CardContent></Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Slow Movers</CardTitle>
          <Button asChild size="sm" variant="outline"><Link href="/analytics/slow-movers">View all <TrendingUp className="size-3.5 ml-1" /></Link></Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Items held a long time without a good return. See the dedicated Slow Movers view for the full breakdown and configurable thresholds.
        </CardContent>
      </Card>
    </div>
  );
}

function BreakdownCard({ title, rows, empty }: { title: string; rows: { key: string; value: number; count: number }[]; empty?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty ?? "No data yet."}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{title.replace("By ", "")}</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="text-sm">{r.key.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.count}</TableCell>
                  <TableCell className={`text-right text-sm tabular-nums font-medium ${r.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatSignedCurrency(r.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
