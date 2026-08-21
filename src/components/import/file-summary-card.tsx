import { CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileSummaryCard({
  fileName,
  fileSize,
  rowCount,
  columnCount,
  onReplace,
}: {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  onReplace: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5">
      <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
        <FileSpreadsheet className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {rowCount} row{rowCount === 1 ? "" : "s"} · {columnCount} column{columnCount === 1 ? "" : "s"} detected ·{" "}
          {formatFileSize(fileSize)}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReplace}>
        Replace file
      </Button>
    </div>
  );
}
