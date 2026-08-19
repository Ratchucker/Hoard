"use client";

import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { netProceeds } from "@/lib/calculations";
import { PnlText } from "@/components/shared/pnl-text";
import { Boxes } from "lucide-react";

export default function LotsPage() {
  return (
    <LoadingGate>
      <LotsContent />
    </LoadingGate>
  );
}

function LotsContent() {
  const lots = useStore((s) => s.lots);
  const collectibles = useStore((s) => s.collectibles);
  const sales = useStore((s) => s.sales);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lot Purchases"
        description={`${lots.length} lot${lots.length === 1 ? "" : "s"}`}
        actions={<Button asChild size="sm"><Link href="/lots/new">Add lot purchase</Link></Button>}
      />

      {lots.length === 0 ? (
        <EmptyState icon={Boxes} title="No lot purchases yet" description="Bought a whole binder or box lot? Track it here and allocate cost basis across the individual items." actionHref="/lots/new" actionLabel="Add lot purchase" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {lots.map((lot) => {
            const items = collectibles.filter((c) => c.lotId === lot.id);
            const lotSales = sales.filter((s) => items.some((i) => i.id === s.collectibleId));
            const recovered = lotSales.reduce((sum, s) => sum + netProceeds(s), 0);
            const profit = lotSales.reduce((sum, s) => sum + (netProceeds(s) - s.costBasisOfSoldUnits), 0);
            const remainingItems = items.filter((i) => i.quantity > 0);
            const remainingValue = remainingItems.reduce((sum, i) => sum + i.estimatedValue * i.quantity, 0);

            return (
              <Link key={lot.id} href={`/lots/${lot.id}`}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{lot.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{formatDate(lot.purchaseDate)} · {items.length} items catalogued</p>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <Row label="Original purchase amount" value={formatCurrency(lot.totalCost.baseAmount)} />
                    <Row label="Amount recovered" value={formatCurrency(recovered)} />
                    <Row label="Profit realised" value={<PnlText value={profit} />} />
                    <Row label="Remaining items" value={String(remainingItems.length)} />
                    <Row label="Remaining estimated value" value={formatCurrency(remainingValue)} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}
