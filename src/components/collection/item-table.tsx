import Link from "next/link";
import type { Collectible, Expense } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { itemCostBasis, unrealisedGain, unrealisedRoi } from "@/lib/calculations";
import { formatCurrency, daysBetween } from "@/lib/format";
import { PnlText } from "@/components/shared/pnl-text";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollShadow } from "@/components/shared/scroll-shadow";

const STICKY_FIRST_COL = "sticky left-0 z-10 bg-card group-hover/row:bg-muted/50";

export function ItemTable({ items, expenses }: { items: Collectible[]; expenses: Expense[] }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <ScrollShadow>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={STICKY_FIRST_COL}>Item</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Condition</TableHead>
              <TableHead className="text-right">Cost Basis</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Unrealised P/L</TableHead>
              <TableHead className="text-right hidden sm:table-cell">ROI</TableHead>
              <TableHead className="text-right hidden md:table-cell">Held</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const costBasis = itemCostBasis(item, expenses);
              const gain = unrealisedGain(item, expenses);
              const roi = unrealisedRoi(item, expenses);
              return (
                <TableRow key={item.id} className="cursor-pointer group/row">
                  <TableCell className={STICKY_FIRST_COL}>
                    <Link href={`/collection/${item.id}`} className="flex flex-col hover:underline">
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.set ?? ""} {item.itemNumber ? `#${item.itemNumber}` : ""}
                        {item.isGraded ? ` · ${item.gradingCompany} ${item.grade}` : ""}
                        {item.quantity > 1 ? ` · x${item.quantity}` : ""}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{CATEGORY_LABELS[item.category]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {item.isGraded ? "Graded" : item.condition.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatCurrency(costBasis)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {formatCurrency(item.estimatedValue * item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <PnlText value={gain} className="justify-end" />
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell tabular-nums text-sm">{roi.toFixed(1)}%</TableCell>
                  <TableCell className="text-right hidden md:table-cell text-sm text-muted-foreground">
                    {daysBetween(item.purchaseDate)}d
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollShadow>
    </div>
  );
}
