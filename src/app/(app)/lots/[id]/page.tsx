"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { allocateLotCost, netProceeds } from "@/lib/calculations";
import { PnlText } from "@/components/shared/pnl-text";
import { ArrowLeft, Plus } from "lucide-react";
import { CATEGORY_LABELS, type Category, money } from "@/lib/types";
import { toast } from "sonner";

export default function LotDetailPage() {
  return (
    <LoadingGate>
      <LotDetailContent />
    </LoadingGate>
  );
}

function LotDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lots = useStore((s) => s.lots);
  const collectibles = useStore((s) => s.collectibles);
  const sales = useStore((s) => s.sales);
  const addCollectible = useStore((s) => s.addCollectible);
  const updateCollectible = useStore((s) => s.updateCollectible);

  const lot = lots.find((l) => l.id === id);
  const items = collectibles.filter((c) => c.lotId === id);

  const [method, setMethod] = React.useState<"equal" | "manual" | "proportional">(lot?.allocationMethod ?? "proportional");
  const [manualAmounts, setManualAmounts] = React.useState<Record<string, string>>({});

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<Category>("trading_card");
  const [newQty, setNewQty] = React.useState("1");
  const [newValue, setNewValue] = React.useState("");

  if (!lot) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lot not found.</p>
        <Button variant="link" asChild><Link href="/lots">Back to Lots</Link></Button>
      </div>
    );
  }

  const lotSales = sales.filter((s) => items.some((i) => i.id === s.collectibleId));
  const recovered = lotSales.reduce((sum, s) => sum + netProceeds(s), 0);
  const profit = lotSales.reduce((sum, s) => sum + (netProceeds(s) - s.costBasisOfSoldUnits), 0);
  const remainingItems = items.filter((i) => i.quantity > 0);
  const remainingValue = remainingItems.reduce((sum, i) => sum + i.estimatedValue * i.quantity, 0);
  const allocatedTotal = items.reduce((sum, i) => sum + (i.allocatedLotCost ?? 0), 0);

  function recalculate() {
    const allocation = allocateLotCost(
      lot!.totalCost.baseAmount,
      items.map((i) => ({ id: i.id, estimatedValue: i.estimatedValue, quantity: i.quantity || i.originalQuantity, manualAmount: Number(manualAmounts[i.id]) || i.allocatedLotCost || 0 })),
      method
    );
    for (const [itemId, amount] of Object.entries(allocation)) {
      updateCollectible(itemId, { allocatedLotCost: amount });
    }
    toast.success("Cost basis reallocated");
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    addCollectible({
      name: newName.trim(),
      category: newCategory,
      quantity: Math.max(1, Number(newQty) || 1),
      condition: "near_mint",
      isGraded: false,
      purchaseDate: lot!.purchaseDate,
      purchasePrice: money(0),
      purchaseSource: lot!.source,
      lotId: lot!.id,
      allocatedLotCost: 0,
      estimatedValue: Number(newValue) || 0,
      estimatedValueIsManual: true,
      tags: [],
    });
    setNewName("");
    setNewValue("");
    setNewQty("1");
    setShowAddForm(false);
    toast.success("Item added to lot — recalculate to update allocation");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push("/lots")}>
        <ArrowLeft className="size-4" /> Back to Lots
      </Button>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{lot.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Purchased {formatDate(lot.purchaseDate)}{lot.seller ? ` from ${lot.seller}` : ""}</p>
        {lot.notes && <p className="text-sm text-muted-foreground mt-1">{lot.notes}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Original purchase" value={formatCurrency(lot.totalCost.baseAmount)} />
        <Stat label="Amount recovered" value={formatCurrency(recovered)} />
        <Stat label="Profit realised" value={<PnlText value={profit} />} />
        <Stat label="Remaining value" value={formatCurrency(remainingValue)} />
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Items in this lot ({items.length})</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowAddForm((v) => !v)}>
            <Plus className="size-3.5" /> Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <form onSubmit={handleAddItem} className="rounded-lg border p-3 grid sm:grid-cols-4 gap-2 items-end">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={newQty} onChange={(e) => setNewQty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Est. value (each)</Label>
                <Input type="number" step="0.01" min={0} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              </div>
              <Button type="submit" size="sm">Add to lot</Button>
            </form>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items catalogued from this lot yet.</p>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Est. Value</TableHead>
                      <TableHead className="text-right">Allocated Cost</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link href={`/collection/${item.id}`} className="text-sm font-medium hover:underline">{item.name}</Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{formatCurrency(item.estimatedValue * (item.quantity || item.originalQuantity))}</TableCell>
                        <TableCell className="text-right">
                          {method === "manual" ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="w-24 ml-auto text-right h-8"
                              value={manualAmounts[item.id] ?? String(item.allocatedLotCost ?? 0)}
                              onChange={(e) => setManualAmounts((m) => ({ ...m, [item.id]: e.target.value }))}
                            />
                          ) : (
                            <span className="tabular-nums text-sm">{formatCurrency(item.allocatedLotCost ?? 0)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground capitalize">{item.status.replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Allocation method</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proportional">Proportional to est. value</SelectItem>
                      <SelectItem value="equal">Equal split</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Allocated {formatCurrency(allocatedTotal)} of {formatCurrency(lot.totalCost.baseAmount)}
                  </span>
                  <Button size="sm" onClick={recalculate}>Recalculate allocation</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
