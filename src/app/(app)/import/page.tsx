"use client";

import * as React from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText } from "lucide-react";
import { money } from "@/lib/types";
import { normalizeCategory, normalizeCondition } from "@/lib/data/import-normalize";
import { toast } from "sonner";

const TARGET_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "category", label: "Category", required: false },
  { key: "set", label: "Set", required: false },
  { key: "number", label: "Number", required: false },
  { key: "quantity", label: "Quantity", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "grade", label: "Grade", required: false },
  { key: "gradingCompany", label: "Grading Company", required: false },
  { key: "currentValue", label: "Current Value", required: false },
  { key: "purchasePrice", label: "Purchase Price", required: false },
  { key: "purchaseDate", label: "Purchase Date", required: false },
];

export default function ImportPage() {
  const router = useRouter();
  const addCollectible = useStore((s) => s.addCollectible);
  const importTemplates = useStore((s) => s.importTemplates);
  const saveImportTemplate = useStore((s) => s.saveImportTemplate);

  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [templateName, setTemplateName] = React.useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setHeaders(result.meta.fields ?? []);
        setRows(result.data);
        toast.success(`Parsed ${result.data.length} rows`);
      },
      error: () => toast.error("Could not parse this file"),
    });
  }

  function applyTemplate(templateId: string) {
    const t = importTemplates.find((t) => t.id === templateId);
    if (t) setMapping(t.mapping);
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
    if (!mapping.name) {
      toast.error("You must map a column to Name");
      return;
    }
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
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Import Collection" description="Upload a CSV exported from another collection app and map its columns." />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">1. Upload CSV</CardTitle></CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer hover:bg-accent/50 transition-colors">
            <UploadCloud className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{fileName || "Click to choose a .csv file"}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">2. Map Columns</CardTitle>
              {importTemplates.length > 0 && (
                <Select onValueChange={applyTemplate}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Apply saved template…" /></SelectTrigger>
                  <SelectContent>
                    {importTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {TARGET_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <Label className="w-40 shrink-0 text-sm">{f.label}{f.required && <span className="text-red-500">*</span>}</Label>
                    <Select value={mapping[f.key] ?? "__none"} onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Not mapped" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Not mapped</SelectItem>
                        {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Input placeholder="Save this mapping as a template…" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="max-w-xs" />
                <Button variant="outline" size="sm" onClick={handleSaveTemplate}>Save template</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">3. Preview ({rows.length} rows)</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {TARGET_FIELDS.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {TARGET_FIELDS.map((f) => (
                          <TableCell key={f.key} className="text-sm">{mapping[f.key] ? row[mapping[f.key]] : <span className="text-muted-foreground">—</span>}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 10 && <p className="text-xs text-muted-foreground mt-2">Showing first 10 of {rows.length} rows.</p>}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={commitImport} className="gap-1.5"><FileText className="size-4" />Import {rows.length} items</Button>
          </div>
        </>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Other Integrations</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["Collectr", "PriceCharting", "TCGplayer", "CollX", "Other"].map((i) => (
            <Badge key={i} variant="outline">{i} — not yet connected</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
