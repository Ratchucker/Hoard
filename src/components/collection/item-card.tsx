import Link from "next/link";
import type { Collectible, Expense } from "@/lib/types";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/types";
import { unrealisedRoi } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import { PnlBadge } from "@/components/shared/pnl-text";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";
import { daysBetween } from "@/lib/format";

export function ItemCard({ item, expenses }: { item: Collectible; expenses: Expense[] }) {
  const roi = unrealisedRoi(item, expenses);
  const days = daysBetween(item.purchaseDate);

  return (
    <Link
      href={`/collection/${item.id}`}
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="size-8 text-muted-foreground/40" />
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.isGraded && (
            <Badge className="bg-background/90 text-foreground border shadow-sm">
              {item.gradingCompany} {item.grade}
            </Badge>
          )}
          {item.quantity > 1 && <Badge className="bg-background/90 text-foreground border shadow-sm">x{item.quantity}</Badge>}
          {item.status === "partially_sold" && <Badge variant="secondary">Partially sold</Badge>}
        </div>
      </div>
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[item.category]}{item.set ? ` · ${item.set}` : ""}</p>
        <p className="font-medium text-sm leading-snug line-clamp-2">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.isGraded ? "Graded" : CONDITION_LABELS[item.condition]} · {days}d held</p>
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="font-semibold tabular-nums">{formatCurrency(item.estimatedValue * item.quantity)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ROI</p>
            <PnlBadge value={roi} />
          </div>
        </div>
      </div>
    </Link>
  );
}
