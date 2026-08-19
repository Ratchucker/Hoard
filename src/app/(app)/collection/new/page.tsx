"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  EXPENSE_TYPE_LABELS,
  PURCHASE_SOURCE_LABELS,
  money,
  type Category,
  type Condition,
  type ExpenseType,
  type PurchaseSource,
} from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface CostRow {
  id: string;
  type: ExpenseType;
  amount: string;
  description: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const addCollectible = useStore((s) => s.addCollectible);
  const addExpense = useStore((s) => s.addExpense);

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<Category>("trading_card");
  const [game, setGame] = React.useState("");
  const [set, setSet] = React.useState("");
  const [itemNumber, setItemNumber] = React.useState("");
  const [variant, setVariant] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [condition, setCondition] = React.useState<Condition>("near_mint");
  const [isGraded, setIsGraded] = React.useState(false);
  const [gradingCompany, setGradingCompany] = React.useState("PSA");
  const [grade, setGrade] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  const [purchaseDate, setPurchaseDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [purchasePrice, setPurchasePrice] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [purchaseSource, setPurchaseSource] = React.useState<PurchaseSource>("ebay");
  const [seller, setSeller] = React.useState("");
  const [purchaseNotes, setPurchaseNotes] = React.useState("");
  const [estimatedValue, setEstimatedValue] = React.useState("");

  const [costRows, setCostRows] = React.useState<CostRow[]>([]);

  function addCostRow() {
    setCostRows((rows) => [...rows, { id: crypto.randomUUID(), type: "shipping", amount: "", description: "" }]);
  }
  function updateCostRow(id: string, patch: Partial<CostRow>) {
    setCostRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeCostRow(id: string) {
    setCostRows((rows) => rows.filter((r) => r.id !== id));
  }

  const purchaseNum = Number(purchasePrice) || 0;
  const costRowsTotal = costRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalCostBasis = purchaseNum + costRowsTotal;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Item name is required");
      return;
    }
    const qty = Math.max(1, Number(quantity) || 1);
    const id = addCollectible({
      name: name.trim(),
      category,
      game: game || undefined,
      set: set || undefined,
      itemNumber: itemNumber || undefined,
      variant: variant || undefined,
      quantity: qty,
      condition: isGraded ? "not_applicable" : condition,
      isGraded,
      gradingCompany: isGraded ? gradingCompany : undefined,
      grade: isGraded ? grade : undefined,
      imageUrl: imageUrl || undefined,
      purchaseDate,
      purchasePrice: money(purchaseNum, currency),
      purchaseSource,
      seller: seller || undefined,
      purchaseNotes: purchaseNotes || undefined,
      estimatedValue: Number(estimatedValue) || purchaseNum,
      estimatedValueIsManual: true,
      tags: [],
      notes: undefined,
    });

    for (const row of costRows) {
      const amount = Number(row.amount) || 0;
      if (amount <= 0) continue;
      addExpense({
        collectibleId: id,
        type: row.type,
        description: row.description || undefined,
        amount: money(amount, currency),
        date: purchaseDate,
        affectsCostBasis: true,
      });
    }

    toast.success(`${name} added to your collection`);
    router.push(`/collection/${id}`);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Add Item" description="Record a purchase and its cost basis." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">1. Basic Information</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Field label="Item name" full>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blade Dragon EX" required />
            </Field>
            <Field label="Category">
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Game / TCG">
              <Input value={game} onChange={(e) => setGame(e.target.value)} placeholder="e.g. Pokemon, MTG" />
            </Field>
            <Field label="Set">
              <Input value={set} onChange={(e) => setSet(e.target.value)} />
            </Field>
            <Field label="Card / item number">
              <Input value={itemNumber} onChange={(e) => setItemNumber(e.target.value)} />
            </Field>
            <Field label="Variant">
              <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="e.g. Holo, 1st Edition" />
            </Field>
            <Field label="Quantity">
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label="Image URL (optional)">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </Field>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={isGraded} onCheckedChange={setIsGraded} id="graded" />
              <Label htmlFor="graded">This item is already graded</Label>
            </div>

            {isGraded ? (
              <>
                <Field label="Grading company">
                  <Input value={gradingCompany} onChange={(e) => setGradingCompany(e.target.value)} placeholder="PSA, BGS, CGC…" />
                </Field>
                <Field label="Grade">
                  <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="10, 9.5…" />
                </Field>
              </>
            ) : (
              <Field label="Condition">
                <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABELS).filter(([k]) => k !== "not_applicable").map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">2. Purchase</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Field label="Purchase date">
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </Field>
            <Field label="Purchase price">
              <div className="flex gap-2">
                <Input type="number" step="0.01" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "NZD", "AUD", "CAD", "JPY"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Field>
            <Field label="Current estimated value">
              <Input type="number" step="0.01" min={0} value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="Defaults to purchase price" />
            </Field>
            <Field label="Purchase source">
              <Select value={purchaseSource} onValueChange={(v) => setPurchaseSource(v as PurchaseSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PURCHASE_SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Seller">
              <Input value={seller} onChange={(e) => setSeller(e.target.value)} />
            </Field>
            <Field label="Notes" full>
              <Textarea value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} rows={2} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">3. Additional Costs</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addCostRow} className="gap-1">
              <Plus className="size-3.5" /> Add cost
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {costRows.length === 0 && <p className="text-sm text-muted-foreground">No additional costs yet — shipping, grading, supplies, etc.</p>}
            {costRows.map((row) => (
              <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Select value={row.type} onValueChange={(v) => updateCostRow(row.id, { type: v as ExpenseType })}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_TYPE_LABELS).filter(([k]) => k !== "marketplace_fee").map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Description (optional)" value={row.description} onChange={(e) => updateCostRow(row.id, { description: e.target.value })} className="flex-1" />
                <Input type="number" step="0.01" min={0} placeholder="0.00" value={row.amount} onChange={(e) => updateCostRow(row.id, { amount: e.target.value })} className="w-full sm:w-28" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCostRow(row.id)}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm font-medium pt-1">
              <span>Total cost basis</span>
              <span className="tabular-nums text-base">{formatCurrency(totalCostBasis, currency)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">Save item</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
