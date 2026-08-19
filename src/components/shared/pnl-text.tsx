import { cn } from "@/lib/utils";
import { formatSignedCurrency, formatSignedPercent, pnlColorClass } from "@/lib/format";
import { TrendingDown, TrendingUp } from "lucide-react";

export function PnlText({
  value,
  percent,
  className,
  showIcon = false,
}: {
  value: number;
  percent?: number;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums font-medium", pnlColorClass(value), className)}>
      {showIcon && (value > 0 ? <TrendingUp className="size-3.5" /> : value < 0 ? <TrendingDown className="size-3.5" /> : null)}
      {formatSignedCurrency(value)}
      {percent !== undefined && <span className="opacity-80">({formatSignedPercent(percent)})</span>}
    </span>
  );
}

export function PnlBadge({ value }: { value: number }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        positive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        negative && "bg-red-500/10 text-red-600 dark:text-red-400",
        !positive && !negative && "bg-muted text-muted-foreground"
      )}
    >
      {formatSignedPercent(value)}
    </span>
  );
}
