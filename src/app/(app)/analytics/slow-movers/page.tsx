"use client";

import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatTile } from "@/components/shared/stat-tile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PnlText } from "@/components/shared/pnl-text";
import { formatCurrency, formatDays } from "@/lib/format";
import { slowMovers } from "@/lib/data/selectors";
import { Clock, Settings } from "lucide-react";

export default function SlowMoversPage() {
  return (
    <LoadingGate>
      <SlowMoversContent />
    </LoadingGate>
  );
}

function SlowMoversContent() {
  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);
  const settings = useStore((s) => s.settings);

  const movers = slowMovers(collectibles, expenses, settings.slowMoverDaysThreshold, settings.slowMoverRoiThreshold);
  const totalTied = movers.reduce((sum, m) => sum + m.costBasis, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slow Movers"
        description="Items held a long time without producing a good return."
        actions={<Button asChild size="sm" variant="outline"><Link href="/settings"><Settings className="size-3.5 mr-1.5" />Adjust thresholds</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4">
        <StatTile label="Slow-Moving Items" value={movers.length} icon={Clock} />
        <StatTile label="Capital Tied Up" value={formatCurrency(totalTied)} />
      </div>

      <p className="text-xs text-muted-foreground">
        Flagged when held ≥ {formatDays(settings.slowMoverDaysThreshold)} AND ROI below {settings.slowMoverRoiThreshold}%.
      </p>

      {movers.length === 0 ? (
        <EmptyState icon={Clock} title="No slow movers" description="Everything in your collection is either recently acquired or performing well." />
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Cost Basis</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Days Held</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movers.map((m) => (
                <TableRow key={m.item.id}>
                  <TableCell><Link href={`/collection/${m.item.id}`} className="text-sm font-medium hover:underline">{m.item.name}</Link></TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatCurrency(m.costBasis)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatCurrency(m.currentValue)}</TableCell>
                  <TableCell className="text-right"><PnlText value={m.gain} className="justify-end" /></TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{m.roi.toFixed(1)}%</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{m.daysHeld}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
