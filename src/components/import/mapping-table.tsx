import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import type { ImportTargetField } from "@/lib/data/import-mapping";
import { cn } from "@/lib/utils";

const NONE = "__none";

export function MappingTable({
  fields,
  headers,
  mapping,
  autoMatched,
  onChange,
}: {
  fields: ImportTargetField[];
  headers: string[];
  mapping: Record<string, string>;
  autoMatched: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 px-4 py-2.5 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        <span>Collectfolio field</span>
        <span>CSV column</span>
        <span className="text-right">Status</span>
      </div>
      <div className="divide-y">
        {fields.map((field) => {
          const value = mapping[field.key] ?? "";
          const isAutoMatched = Boolean(autoMatched[field.key]) && value === autoMatched[field.key];
          const isManual = Boolean(value) && !isAutoMatched;
          const missingRequired = field.required && !value;

          return (
            <div
              key={field.key}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 items-center px-4 py-2.5"
            >
              <span className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-brand ml-0.5">*</span>}
              </span>
              <Select value={value || NONE} onValueChange={(v) => onChange(field.key, v === NONE ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not mapped</SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="justify-self-end">
                {isAutoMatched && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Auto-matched
                  </Badge>
                )}
                {isManual && <Badge variant="outline">Mapped</Badge>}
                {!value && (
                  <span className={cn("text-xs", missingRequired ? "text-brand font-medium" : "text-muted-foreground")}>
                    {missingRequired ? "Required" : "Not mapped"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
