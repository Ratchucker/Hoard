"use client";

import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { PnlText } from "@/components/shared/pnl-text";
import { ArrowLeftRight } from "lucide-react";

export default function TradesPage() {
  return (
    <LoadingGate>
      <TradesContent />
    </LoadingGate>
  );
}

function TradesContent() {
  const trades = useStore((s) => s.trades);
  const tradeItems = useStore((s) => s.tradeItems);
  const collectibles = useStore((s) => s.collectibles);

  const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trades"
        description={`${trades.length} trade${trades.length === 1 ? "" : "s"} recorded`}
        actions={<Button asChild size="sm"><Link href="/trades/new">Record trade</Link></Button>}
      />

      {sorted.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No trades yet" description="Record a card-for-card trade to keep full transaction history without treating it as a simple sale." actionHref="/trades/new" actionLabel="Record trade" />
      ) : (
        <div className="space-y-4">
          {sorted.map((trade) => {
            const items = tradeItems.filter((ti) => ti.tradeId === trade.id);
            const given = items.filter((i) => i.direction === "given");
            const received = items.filter((i) => i.direction === "received");
            const givenValue = given.reduce((s, i) => s + i.estimatedValue, 0);
            const receivedValue = received.reduce((s, i) => s + i.estimatedValue, 0);
            const diff = receivedValue + trade.cashReceived - trade.cashAdded - givenValue;

            return (
              <Card key={trade.id}>
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {formatDate(trade.date)}{trade.counterparty ? ` · with ${trade.counterparty}` : ""}
                  </CardTitle>
                  <PnlText value={diff} />
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Gave ({formatCurrency(givenValue)})</p>
                    <ul className="space-y-1">
                      {given.map((g) => {
                        const item = collectibles.find((c) => c.id === g.collectibleId);
                        return (
                          <li key={g.id}>
                            <Link href={`/collection/${g.collectibleId}`} className="hover:underline">{item?.name ?? "Item"}</Link>
                            <span className="text-muted-foreground"> — {formatCurrency(g.estimatedValue)}</span>
                          </li>
                        );
                      })}
                      {trade.cashAdded > 0 && <li className="text-muted-foreground">+ {formatCurrency(trade.cashAdded)} cash</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Received ({formatCurrency(receivedValue)})</p>
                    <ul className="space-y-1">
                      {received.map((r) => {
                        const item = collectibles.find((c) => c.id === r.collectibleId);
                        return (
                          <li key={r.id}>
                            <Link href={`/collection/${r.collectibleId}`} className="hover:underline">{item?.name ?? "Item"}</Link>
                            <span className="text-muted-foreground"> — {formatCurrency(r.estimatedValue)}</span>
                          </li>
                        );
                      })}
                      {trade.cashReceived > 0 && <li className="text-muted-foreground">+ {formatCurrency(trade.cashReceived)} cash</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
