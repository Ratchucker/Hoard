"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_TYPE_LABELS, money, type ExpenseType } from "@/lib/types";
import { toast } from "sonner";

export default function NewExpensePage() {
  return (
    <Suspense fallback={null}>
      <NewExpenseForm />
    </Suspense>
  );
}

function NewExpenseForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselected = params.get("item") ?? undefined;

  const collectibles = useStore((s) => s.collectibles);
  const addExpense = useStore((s) => s.addExpense);

  const [scope, setScope] = React.useState<"item" | "general">(preselected ? "item" : "general");
  const [collectibleId, setCollectibleId] = React.useState(preselected ?? "");
  const [type, setType] = React.useState<ExpenseType>("supplies");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [affectsCostBasis, setAffectsCostBasis] = React.useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount) || 0;
    if (amt <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    if (scope === "item" && !collectibleId) {
      toast.error("Select an item");
      return;
    }
    addExpense({
      collectibleId: scope === "item" ? collectibleId : undefined,
      type,
      description: description || undefined,
      amount: money(amt),
      date,
      affectsCostBasis: scope === "item" ? affectsCostBasis : false,
    });
    toast.success("Expense added");
    router.push(scope === "item" ? `/collection/${collectibleId}` : "/activity");
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Add Expense" description="Attach to an item's cost basis, or log a general business expense." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-lg border p-1 w-fit">
              <Button type="button" size="sm" variant={scope === "item" ? "secondary" : "ghost"} onClick={() => setScope("item")}>Item expense</Button>
              <Button type="button" size="sm" variant={scope === "general" ? "secondary" : "ghost"} onClick={() => setScope("general")}>General expense</Button>
            </div>

            {scope === "item" && (
              <div className="space-y-1.5">
                <Label>Item</Label>
                <Select value={collectibleId} onValueChange={setCollectibleId}>
                  <SelectTrigger><SelectValue placeholder="Select item…" /></SelectTrigger>
                  <SelectContent>
                    {collectibles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Expense type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ExpenseType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" step="0.01" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description (optional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="e.g. Toploaders + sleeves bulk pack" />
              </div>
            </div>

            {scope === "item" && (
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={affectsCostBasis} onCheckedChange={setAffectsCostBasis} id="cost-basis" />
                <Label htmlFor="cost-basis">Include in this item&rsquo;s cost basis</Label>
              </div>
            )}
            {scope === "general" && (
              <p className="text-xs text-muted-foreground">
                General expenses affect overall business profitability reporting but do not change any individual item&rsquo;s cost basis.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">Save expense</Button>
        </div>
      </form>
    </div>
  );
}
