"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { PnlText } from "@/components/shared/pnl-text";
import { itemCostBasis } from "@/lib/calculations";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GivenRow {
  id: string;
  collectibleId: string;
  estimatedValue: string;
}
interface ReceivedRow {
  id: string;
  name: string;
  category: Category;
  estimatedValue: string;
}

export default function NewTradePage() {
  const router = useRouter();
  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);
  const recordTrade = useStore((s) => s.recordTrade);

  const owned = collectibles.filter((c) => c.quantity > 0);

  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [counterparty, setCounterparty] = React.useState("");
  const [cashAdded, setCashAdded] = React.useState("0");
  const [cashReceived, setCashReceived] = React.useState("0");
  const [fees, setFees] = React.useState("0");
  const [shipping, setShipping] = React.useState("0");
  const [notes, setNotes] = React.useState("");

  const [given, setGiven] = React.useState<GivenRow[]>([]);
  const [received, setReceived] = React.useState<ReceivedRow[]>([]);

  function addGivenRow() {
    const first = owned.find((o) => !given.some((g) => g.collectibleId === o.id));
    if (!first) {
      toast.error("No more owned items available");
      return;
    }
    setGiven((rows) => [...rows, { id: crypto.randomUUID(), collectibleId: first.id, estimatedValue: String(first.estimatedValue) }]);
  }
  function addReceivedRow() {
    setReceived((rows) => [...rows, { id: crypto.randomUUID(), name: "", category: "trading_card", estimatedValue: "" }]);
  }

  const givenTotal = given.reduce((sum, g) => sum + (Number(g.estimatedValue) || 0), 0);
  const receivedTotal = received.reduce((sum, r) => sum + (Number(r.estimatedValue) || 0), 0);
  const cashDelta = (Number(cashReceived) || 0) - (Number(cashAdded) || 0);
  const tradeDifference = receivedTotal + cashDelta - givenTotal;
  const givenCostBasis = given.reduce((sum, g) => {
    const item = collectibles.find((c) => c.id === g.collectibleId);
    return sum + (item ? itemCostBasis(item, expenses) : 0);
  }, 0);
  const transferredCostBasis = givenCostBasis + (Number(cashAdded) || 0) + (Number(fees) || 0) + (Number(shipping) || 0) - (Number(cashReceived) || 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (given.length === 0 && received.length === 0) {
      toast.error("Add at least one item to the trade");
      return;
    }
    if (received.some((r) => !r.name.trim())) {
      toast.error("Every received item needs a name");
      return;
    }
    recordTrade({
      date,
      counterparty: counterparty || undefined,
      cashAdded: Number(cashAdded) || 0,
      cashReceived: Number(cashReceived) || 0,
      fees: Number(fees) || 0,
      shipping: Number(shipping) || 0,
      notes: notes || undefined,
      given: given.map((g) => ({ collectibleId: g.collectibleId, estimatedValue: Number(g.estimatedValue) || 0 })),
      received: received.map((r) => ({
        name: r.name.trim(),
        category: r.category,
        quantity: 1,
        condition: "near_mint" as const,
        isGraded: false,
        purchaseDate: date,
        purchasePrice: { currency: "USD", amount: 0, exchangeRate: 1, baseAmount: 0 },
        purchaseSource: "private_sale" as const,
        estimatedValue: Number(r.estimatedValue) || 0,
        estimatedValueIsManual: true,
        tags: [],
        allocatedLotCost: transferredCostBasis > 0 && received.length > 0 ? transferredCostBasis / received.length : 0,
      })),
    });
    toast.success("Trade recorded");
    router.push("/trades");
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Record Trade" description="Log a card-for-card (or box-for-box) trade, with cash and fees on either side." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Trade Details</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Counterparty (optional)"><Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} /></Field>
            <Field label="Cash I added"><Input type="number" step="0.01" min={0} value={cashAdded} onChange={(e) => setCashAdded(e.target.value)} /></Field>
            <Field label="Cash I received"><Input type="number" step="0.01" min={0} value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} /></Field>
            <Field label="Fees"><Input type="number" step="0.01" min={0} value={fees} onChange={(e) => setFees(e.target.value)} /></Field>
            <Field label="Shipping"><Input type="number" step="0.01" min={0} value={shipping} onChange={(e) => setShipping(e.target.value)} /></Field>
            <Field label="Notes" full><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Items I Gave</CardTitle>
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addGivenRow}><Plus className="size-3.5" />Add</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {given.length === 0 && <p className="text-sm text-muted-foreground">No items added.</p>}
            {given.map((row) => (
              <div key={row.id} className="flex gap-2 items-center">
                <Select value={row.collectibleId} onValueChange={(v) => setGiven((rows) => rows.map((r) => (r.id === row.id ? { ...r, collectibleId: v } : r)))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {owned.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.01" className="w-28" value={row.estimatedValue} onChange={(e) => setGiven((rows) => rows.map((r) => (r.id === row.id ? { ...r, estimatedValue: e.target.value } : r)))} placeholder="Est. value" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setGiven((rows) => rows.filter((r) => r.id !== row.id))}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Items I Received</CardTitle>
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addReceivedRow}><Plus className="size-3.5" />Add</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {received.length === 0 && <p className="text-sm text-muted-foreground">No items added.</p>}
            {received.map((row) => (
              <div key={row.id} className="flex gap-2 items-center flex-wrap">
                <Input placeholder="Item name" className="flex-1 min-w-[140px]" value={row.name} onChange={(e) => setReceived((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))} />
                <Select value={row.category} onValueChange={(v) => setReceived((rows) => rows.map((r) => (r.id === row.id ? { ...r, category: v as Category } : r)))}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.01" className="w-28" value={row.estimatedValue} onChange={(e) => setReceived((rows) => rows.map((r) => (r.id === row.id ? { ...r, estimatedValue: e.target.value } : r)))} placeholder="Est. value" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setReceived((rows) => rows.filter((r) => r.id !== row.id))}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SummaryRow label="Estimated value given" value={formatCurrency(givenTotal)} />
            <SummaryRow label="Estimated value received" value={formatCurrency(receivedTotal)} />
            <SummaryRow label="Cash difference" value={formatCurrency(cashDelta)} />
            <Separator />
            <SummaryRow label="Trade market difference" value={<PnlText value={tradeDifference} />} bold />
            <SummaryRow label="Cost basis transferred to received items" value={formatCurrency(transferredCostBasis)} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">Record trade</Button>
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
function SummaryRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}
