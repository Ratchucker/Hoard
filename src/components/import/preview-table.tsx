import { ImageOff } from "lucide-react";
import type { ImportTargetField } from "@/lib/data/import-mapping";

export function PreviewTable({
  fields,
  rows,
  mapping,
  totalRowCount,
}: {
  fields: ImportTargetField[];
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  totalRowCount: number;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-muted/60 backdrop-blur supports-backdrop-blur:bg-muted/40">
              <th className="w-12 px-3 py-2.5" aria-hidden />
              {fields.map((f) => (
                <th
                  key={f.key}
                  className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/40 transition-colors">
                <td className="px-3 py-2">
                  {/* Reserved for a card thumbnail once image import is supported. */}
                  <div className="flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground/50">
                    <ImageOff className="size-3.5" />
                  </div>
                </td>
                {fields.map((f) => {
                  const column = mapping[f.key];
                  const value = column ? row[column] : "";
                  return (
                    <td key={f.key} className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {value ? value : <span className="text-muted-foreground/50">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalRowCount > rows.length && (
        <p className="px-4 py-2.5 text-xs text-muted-foreground border-t bg-muted/20">
          Showing {rows.length} of {totalRowCount} rows.
        </p>
      )}
    </div>
  );
}
