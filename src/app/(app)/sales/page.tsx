"use client";

import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PnlText } from "@/components/shared/pnl-text";
import { formatCurrency, formatDate } from "@/lib/format";
import { holdingPeriodDays, netProceeds, realisedProfit, realisedRoi } from "@/lib/calculations";
import { Receipt } from "lucide-react";

export default function SalesPage() {
  return (
    <LoadingGate>
      <SalesContent />
    </LoadingGate>
  );
}

function SalesContent() {
  const sales = useStore((s) => s.sales);
  const collectibles = useStore((s) => s.collectibles);
  const marketplaces = useStore((s) => s.marketplaces);

  const sorted = [...sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  const totalProfit = sales.reduce((sum, s) => sum + realisedProfit(s), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales"
        description={`${sales.length} sale${sales.length === 1 ? "" : "s"} · Total realised profit ${formatCurrency(totalProfit)}`}
        actions={<Button asChild size="sm"><Link href="/sales/new">Record sale</Link></Button>}
      />

      {sorted.length === 0 ? (
        <EmptyState icon={Receipt} title="No sales yet" description="Once you sell an item it moves here permanently, with realised profit and ROI." actionHref="/sales/new" actionLabel="Record a sale" />
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell">Marketplace</TableHead>
                <TableHead className="hidden md:table-cell">Sale Date</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Net Proceeds</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right hidden sm:table-cell">ROI</TableHead>
                <TableHead className="text-right hidden md:table-cell">Held</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((sale) => {
                const item = collectibles.find((c) => c.id === sale.collectibleId);
                const marketplace = marketplaces.find((m) => m.id === sale.marketplaceId);
                const profit = realisedProfit(sale);
                const roi = realisedRoi(sale);
                const held = item ? holdingPeriodDays(item.purchaseDate, sale.saleDate) : 0;
                return (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {item ? (
                        <Link href={`/collection/${item.id}`} className="font-medium text-sm hover:underline">{item.name}{sale.quantitySold > 1 ? ` x${sale.quantitySold}` : ""}</Link>
                      ) : (
                        <span className="text-sm">Unknown item</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{marketplace?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(sale.saleDate)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatCurrency(sale.salePrice.baseAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm hidden lg:table-cell">{formatCurrency(netProceeds(sale))}</TableCell>
                    <TableCell className="text-right"><PnlText value={profit} className="justify-end" /></TableCell>
                    <TableCell className="text-right hidden sm:table-cell tabular-nums text-sm">{roi.toFixed(1)}%</TableCell>
                    <TableCell className="text-right hidden md:table-cell text-sm text-muted-foreground">{held}d</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
