import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportStep = "upload" | "map" | "review" | "import";

const STEPS: { key: ImportStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Map columns" },
  { key: "review", label: "Review" },
  { key: "import", label: "Import" },
];

export function StepIndicator({ current }: { current: ImportStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center w-full max-w-2xl">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex items-center justify-center size-6 rounded-full text-[11px] font-semibold shrink-0 transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-brand text-brand-foreground",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium whitespace-nowrap hidden sm:inline",
                  active ? "text-foreground" : done ? "text-foreground/70" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn("mx-3 h-px flex-1 min-w-4 transition-colors", done ? "bg-primary" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
