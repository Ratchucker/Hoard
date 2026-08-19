"use client";

import * as React from "react";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { netProceeds, realisedProfit } from "@/lib/calculations";
import { Download, Printer, Info } from "lucide-react";

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  return (
    <LoadingGate>
      <ReportsContent />
    </LoadingGate>
  );
}

function ReportsContent() {
  const sales = useStore((s) => s.sales);
  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);
  const marketplaces = useStore((s) => s.marketplaces);

  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  const filteredSales = sales.filter((s) => (!start || s.saleDate >= start) && (!end || s.saleDate <= end));
  const filteredPurchases = collectibles.filter((c) => (!start || c.purchaseDate >= start) && (!end || c.purchaseDate <= end));
  const filteredExpenses = expenses.filter((e) => (!start || e.date >= start) && (!end || e.date <= end));

  const grossProceeds = filteredSales.reduce((sum, s) => sum + s.salePrice.baseAmount + s.buyerShippingCharged, 0);
  const totalCostBasis = filteredSales.reduce((sum, s) => sum + s.costBasisOfSoldUnits, 0);
  const totalFees = filteredSales.reduce((sum, s) => sum + s.marketplaceFee + s.paymentProcessingFee + s.otherFees, 0);
  const totalShipping = filteredSales.reduce((sum, s) => sum + s.sellerShippingCost, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount.baseAmount, 0);
  const realised = filteredSales.reduce((sum, s) => sum + realisedProfit(s), 0);

  function exportSalesCsv() {
    const rows = filteredSales.map((s) => {
      const item = collectibles.find((c) => c.id === s.collectibleId);
      const marketplace = marketplaces.find((m) => m.id === s.marketplaceId);
      return {
        Item: item?.name ?? "",
        "Sale Date": s.saleDate,
        Marketplace: marketplace?.name ?? "",
        "Sale Price": s.salePrice.baseAmount,
        "Net Proceeds": netProceeds(s),
        "Cost Basis": s.costBasisOfSoldUnits,
        "Realised Profit": realisedProfit(s),
      };
    });
    downloadCsv("sales-export.csv", toCsv(rows));
  }

  function exportPurchasesCsv() {
    const rows = filteredPurchases.map((c) => ({
      Item: c.name,
      Category: c.category,
      "Purchase Date": c.purchaseDate,
      "Purchase Price": c.purchasePrice.baseAmount,
      Quantity: c.quantity,
    }));
    downloadCsv("purchases-export.csv", toCsv(rows));
  }

  function exportExpensesCsv() {
    const rows = filteredExpenses.map((e) => ({
      Type: e.type,
      Description: e.description ?? "",
      Date: e.date,
      Amount: e.amount.baseAmount,
      "Attached Item": collectibles.find((c) => c.id === e.collectibleId)?.name ?? "General",
    }));
    downloadCsv("expenses-export.csv", toCsv(rows));
  }

  return (
    <div className="space-y-6 max-w-4xl print:max-w-full">
      <div className="print:hidden">
        <PageHeader title="Reports & Export" description="Download your records for accounting or your own reference." />
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5 print:hidden">
        <CardContent className="pt-6 flex gap-3 text-sm">
          <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            These exports are for your own records and accounting convenience only. This is <strong>not tax advice</strong> — consult a qualified professional for tax filing.
          </p>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Date Range</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5"><Label>Start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          {(start || end) && <Button variant="ghost" size="sm" onClick={() => { setStart(""); setEnd(""); }}>Clear</Button>}
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="size-3.5" />Printable report</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Annual / Range Summary</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <Summary label="Purchases" value={filteredPurchases.length} />
          <Summary label="Sales" value={filteredSales.length} />
          <Summary label="Gross proceeds" value={formatCurrency(grossProceeds)} />
          <Summary label="Cost basis (sold)" value={formatCurrency(totalCostBasis)} />
          <Summary label="Fees" value={formatCurrency(totalFees)} />
          <Summary label="Shipping (seller)" value={formatCurrency(totalShipping)} />
          <Summary label="Other expenses" value={formatCurrency(totalExpenses)} />
          <Summary label="Realised profit/loss" value={formatCurrency(realised)} />
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Downloads</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportSalesCsv}><Download className="size-3.5" />Sales CSV</Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportPurchasesCsv}><Download className="size-3.5" />Purchases CSV</Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportExpensesCsv}><Download className="size-3.5" />Expenses CSV</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sales in Range</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Cost Basis</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((s) => {
                  const item = collectibles.find((c) => c.id === s.collectibleId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{item?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(s.saleDate)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(s.salePrice.baseAmount)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(s.costBasisOfSoldUnits)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(realisedProfit(s))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
