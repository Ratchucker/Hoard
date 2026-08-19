import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  sublabel,
  valueClassName,
  icon: Icon,
  size = "md",
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  valueClassName?: string;
  icon?: LucideIcon;
  size?: "md" | "lg";
}) {
  return (
    <div className="rounded-xl border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p
        className={cn(
          "mt-1.5 font-semibold tracking-tight tabular-nums",
          size === "lg" ? "text-3xl" : "text-2xl",
          valueClassName
        )}
      >
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
