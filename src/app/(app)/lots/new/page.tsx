"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PURCHASE_SOURCE_LABELS, type PurchaseSource } from "@/lib/types";
import { toast } from "sonner";

export default function NewLotPage() {
  const router = useRouter();
  const createLot = useStore((s) => s.createLot);

  const [name, setName] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [totalCost, setTotalCost] = React.useState("");
  const [source, setSource] = React.useState<PurchaseSource>("facebook");
  const [seller, setSeller] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [allocationMethod, setAllocationMethod] = React.useState<"equal" | "manual" | "proportional">("proportional");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Lot name is required");
      return;
    }
    const id = createLot({
      name: name.trim(),
      purchaseDate,
      totalCost: Number(totalCost) || 0,
      source,
      seller: seller || undefined,
      notes: notes || undefined,
      allocationMethod,
    });
    toast.success("Lot created — now add the items it contains");
    router.push(`/lots/${id}`);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Lot Purchase" description="Buy a whole collection at once, then allocate cost basis across items." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Lot name" full>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pokemon Binder Collection" required />
            </Field>
            <Field label="Purchase date">
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </Field>
            <Field label="Total price">
              <Input type="number" step="0.01" min={0} value={totalCost} onChange={(e) => setTotalCost(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Source">
              <Select value={source} onValueChange={(v) => setSource(v as PurchaseSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PURCHASE_SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Seller">
              <Input value={seller} onChange={(e) => setSeller(e.target.value)} />
            </Field>
            <Field label="Cost allocation method" full>
              <Select value={allocationMethod} onValueChange={(v) => setAllocationMethod(v as typeof allocationMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proportional">Proportional to estimated value</SelectItem>
                  <SelectItem value="equal">Equal split</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notes" full>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </Field>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">Create lot</Button>
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
