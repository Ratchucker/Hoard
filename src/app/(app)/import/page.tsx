"use client";

import * as React from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { money } from "@/lib/types";
import { normalizeCategory, normalizeCondition } from "@/lib/data/import-normalize";
import { TARGET_FIELDS, autoMatchColumns } from "@/lib/data/import-mapping";
import { StepIndicator, type ImportStep } from "@/components/import/step-indicator";
import { FileDropzone } from "@/components/import/file-dropzone";
import { FileSummaryCard } from "@/components/import/file-summary-card";
import { MappingTable } from "@/components/import/mapping-table";
import { PreviewTable } from "@/components/import/preview-table";
import { toast } from "sonner";

const INTEGRATIONS = ["Collectr", "TCGplayer", "CollX", "Other"];

export default function ImportPage() {
  const router = useRouter();
  const addCollectible = useStore((s) => s.addCollectible);
  const importTemplates = useStore((s) => s.importTemplates);
  const saveImportTemplate = useStore((s) => s.saveImportTemplate);

  const [step, setStep] = React.useState<ImportStep>("upload");
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [fileSize, setFileSize] = React.useState(0);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [autoMatched, setAutoMatched] = React.useState<Record<string, string>>({});
  const [templateName, setTemplateName] = React.useState("");
  const [importing, setImporting] = React.useState(false);

  const matchedCount = TARGET_FIELDS.filter((f) => mapping[f.key]).length;
  const canReview = Boolean(mapping.name);

  function handleFile(file: File) {
    setFileName(file.name);
    setFileSize(file.size);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedHeaders = result.meta.fields ?? [];
        const matches = autoMatchColumns(parsedHeaders);
        setHeaders(parsedHeaders);
        setRows(result.data);
        setMapping(matches);
        setAutoMatched(matches);
        toast.success(`Parsed ${result.data.length} rows`);
      },
      error: () => toast.error("Could not parse this file"),
    });
  }

  function handleReplace() {
    setHeaders([]);
    setRows([]);
    setFileName("");
    setFileSize(0);
    setMapping({});
    setAutoMatched({});
  }

  function applyTemplate(templateId: string) {
    const t = importTemplates.find((t) => t.id === templateId);
    if (t) {
      setMapping(t.mapping);
      toast.success(`Applied "${t.name}"`);
    }
  }

  function handleSaveTemplate() {
    if (!templateName.trim()) {
      toast.error("Give this template a name");
      return;
    }
    saveImportTemplate(templateName.trim(), mapping);
    toast.success("Import template saved");
    setTemplateName("");
  }

  function commitImport() {
    setStep("import");
    setImporting(true);
    window.setTimeout(() => {
      let imported = 0;
      for (const row of rows) {
        const name = mapping.name ? row[mapping.name] : undefined;
        if (!name) continue;
        const purchasePrice = mapping.purchasePrice ? Number(row[mapping.purchasePrice]) || 0 : 0;
        const currentValue = mapping.currentValue ? Number(row[mapping.currentValue]) || 0 : purchasePrice;
        const quantity = mapping.quantity ? Math.max(1, Number(row[mapping.quantity]) || 1) : 1;
        const grade = mapping.grade ? row[mapping.grade] : undefined;
        addCollectible({
          name,
          category: normalizeCategory(mapping.category ? row[mapping.category] : undefined),
          set: mapping.set ? row[mapping.set] : undefined,
          itemNumber: mapping.number ? row[mapping.number] : undefined,
          quantity,
          condition: normalizeCondition(mapping.condition ? row[mapping.condition] : undefined),
          isGraded: !!grade,
          grade: grade || undefined,
          gradingCompany: mapping.gradingCompany ? row[mapping.gradingCompany] : undefined,
          purchaseDate: mapping.purchaseDate ? row[mapping.purchaseDate] : new Date().toISOString().slice(0, 10),
          purchasePrice: money(purchasePrice),
          purchaseSource: "other",
          estimatedValue: currentValue,
          estimatedValueIsManual: true,
          tags: [],
        });
        imported += 1;
      }
      toast.success(`Imported ${imported} item${imported === 1 ? "" : "s"}`);
      router.push("/collection");
    }, 500);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Import Collection</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Move your existing collection into Hoard.</p>
      </div>

      <div className="flex justify-center py-1">
        <StepIndicator current={step} />
      </div>

      {step === "upload" && (
        <div className="space-y-6">
          {headers.length === 0 ? (
            <FileDropzone onFile={handleFile} />
          ) : (
            <FileSummaryCard
              fileName={fileName}
              fileSize={fileSize}
              rowCount={rows.length}
              columnCount={headers.length}
              onReplace={handleReplace}
            />
          )}

          {headers.length === 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Other integrations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {INTEGRATIONS.map((i) => (
                  <Badge key={i} variant="outline">
                    {i} — not yet connected
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {headers.length > 0 && (
            <div className="flex justify-end">
              <Button variant="accent" className="gap-1.5" onClick={() => setStep("map")}>
                Continue to mapping
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {step === "map" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-medium">{matchedCount}</span> of{" "}
              <span className="font-medium">{TARGET_FIELDS.length}</span> fields automatically matched
            </p>
            {importTemplates.length > 0 && (
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Apply saved template…" />
                </SelectTrigger>
                <SelectContent>
                  {importTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <MappingTable
            fields={TARGET_FIELDS}
            headers={headers}
            mapping={mapping}
            autoMatched={autoMatched}
            onChange={(key, value) => setMapping((m) => ({ ...m, [key]: value }))}
          />

          <div className="flex items-center gap-2 text-xs">
            <Input
              placeholder="Save this mapping as a template…"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="max-w-64 h-8"
            />
            <Button variant="ghost" size="sm" onClick={handleSaveTemplate}>
              Save template
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" className="gap-1.5" onClick={() => setStep("upload")}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button variant="accent" className="gap-1.5" disabled={!canReview} onClick={() => setStep("review")}>
              Review Import
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {(step === "review" || step === "import") && (
        <div className="space-y-5">
          <PreviewTable fields={TARGET_FIELDS} rows={rows.slice(0, 10)} mapping={mapping} totalRowCount={rows.length} />

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" className="gap-1.5" disabled={importing} onClick={() => setStep("map")}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button variant="accent" className="gap-1.5" disabled={importing} onClick={commitImport}>
              {importing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Import {rows.length} item{rows.length === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
